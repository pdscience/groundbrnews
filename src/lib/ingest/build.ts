import type { Article, Source, Story } from '@/types/analysis'
import { resolveSourceId, slugify, stableId } from './normalize'
import { buildStoryText } from './summarize'
import { classifyTheme, DEFAULT_THEME } from './theme'
import { estimateTone } from './tone'
import { jaccard, tokenSet, tokenize } from './text'

export interface BuildOptions {
  now?: string
  maxStories?: number
  maxArticlesPerStory?: number
}

const RELIABILITY_RANK = { high: 2, medium: 1, low: 0 } as const

function pickMedoid(cluster: Article[]): Article {
  const tokenSets = cluster.map((article) => tokenSet(tokenize(`${article.title} ${article.excerpt}`)))

  let bestIndex = 0
  let bestScore = -1

  cluster.forEach((_, index) => {
    const own = tokenSets[index]!
    let score = 0
    tokenSets.forEach((other, otherIndex) => {
      if (otherIndex !== index) score += jaccard(own, other)
    })
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return cluster[bestIndex]!
}

function majority<T>(values: T[]): T | undefined {
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let winner: T | undefined
  let best = 0
  for (const [value, count] of counts) {
    if (count > best) {
      best = count
      winner = value
    }
  }
  return winner
}

export function buildStories(
  articles: Article[],
  groups: string[][],
  sources: Source[],
  options: BuildOptions = {},
): Story[] {
  const { now = new Date().toISOString(), maxStories = 80, maxArticlesPerStory = 12 } = options
  const byId = new Map(articles.map((article) => [article.id, article]))
  const sourceById = new Map(sources.map((source) => [source.id, source]))
  const usedSlugs = new Set<string>()
  const stories: Story[] = []

  for (const group of groups) {
    const members = group
      .map((id) => byId.get(id))
      .filter((article): article is Article => Boolean(article))
      .sort((left, right) => Date.parse(left.publishedAt) - Date.parse(right.publishedAt))

    if (members.length < 2) continue

    const perSource = new Map<string, Article>()
    for (const article of members) {
      if (!perSource.has(article.sourceId)) perSource.set(article.sourceId, article)
    }
    const unique = [...perSource.values()]
    if (unique.length < 2) continue

    const limited = unique.slice(0, maxArticlesPerStory)
    const medoid = pickMedoid(limited)

    const themes = limited.map((article) => classifyTheme(article.title, article.excerpt))
    const theme = majority(themes) ?? DEFAULT_THEME

    const medoidSource = sourceById.get(medoid.sourceId)
    const region = majority(
      limited
        .map((article) => sourceById.get(article.sourceId)?.ratings.region)
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    )
    const state = majority(
      limited
        .map((article) => sourceById.get(article.sourceId)?.state)
        .filter((value): value is string => Boolean(value)),
    )

    const enriched: Article[] = limited.map((article) => {
      const tone = estimateTone(article.title, article.excerpt)
      return { ...article, stance: tone.stance, stanceEstimated: true }
    })

    const text = buildStoryText(
      enriched.map((article) => ({ title: article.title, excerpt: article.excerpt })),
    )

    const canonicalTitle = medoid.title
    const baseSlug = slugify(canonicalTitle) || `historia-${stableId(medoid.url)}`
    let slug = baseSlug
    if (usedSlugs.has(slug)) slug = `${baseSlug}-${stableId(medoid.url)}`
    usedSlugs.add(slug)

    const image = enriched.find((article) => article.image)?.image

    stories.push({
      id: `st-${stableId(slug)}`,
      slug,
      title: canonicalTitle,
      summary: text.summary,
      debate: text.debate,
      theme,
      region: region ?? medoidSource?.ratings.region ?? 'sudeste',
      state: state ?? medoidSource?.state ?? 'DF',
      articles: enriched,
      ...(image ? { image } : {}),
      updatedAt: now,
    })
  }

  const ranked = stories.sort((left, right) => {
    const countDiff = right.articles.length - left.articles.length
    if (countDiff !== 0) return countDiff
    const leftReliability = Math.max(
      ...left.articles.map((article) => RELIABILITY_RANK[sourceById.get(article.sourceId)?.reliability ?? 'low']),
    )
    const rightReliability = Math.max(
      ...right.articles.map((article) => RELIABILITY_RANK[sourceById.get(article.sourceId)?.reliability ?? 'low']),
    )
    return rightReliability - leftReliability
  })

  return ranked.slice(0, maxStories)
}

export function resolveArticleSources(articles: Article[], sources: Source[]): Article[] {
  return articles
    .map((article) => {
      const resolved = resolveSourceId(article.url, sources)
      return resolved && resolved !== article.sourceId ? { ...article, sourceId: resolved } : article
    })
    .filter((article) => sources.some((source) => source.id === article.sourceId))
}
