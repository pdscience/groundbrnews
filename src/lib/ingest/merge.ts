import type { Article, Source, Story } from '@/types/analysis'

export interface MergeOptions {
  now?: string
  retentionDays?: number
  maxStories?: number
  maxArticlesPerStory?: number
}

export interface MergeResult {
  stories: Story[]
  freshStories: number
  mergedStories: number
  retainedStories: number
  expiredStories: number
}

const RELIABILITY_RANK: Record<Source['reliability'], number> = {
  high: 2,
  medium: 1,
  low: 0,
}

function timeOf(article: Article): number {
  const value = Date.parse(article.publishedAt)
  return Number.isFinite(value) ? value : 0
}

function newestArticleAt(story: Story): number {
  return story.articles.reduce((newest, article) => Math.max(newest, timeOf(article)), 0)
}

function dedupeArticles(articles: Article[], maxItems: number): Article[] {
  const byUrl = new Map<string, Article>()
  for (const article of articles) {
    if (!byUrl.has(article.url)) byUrl.set(article.url, article)
  }

  const bySource = new Map<string, Article>()
  const ordered = [...byUrl.values()].sort((left, right) => timeOf(left) - timeOf(right))
  for (const article of ordered) {
    if (!bySource.has(article.sourceId)) bySource.set(article.sourceId, article)
  }

  return [...bySource.values()]
    .sort((left, right) => timeOf(left) - timeOf(right))
    .slice(0, maxItems)
}

function bestReliability(story: Story, rank: Map<string, number>): number {
  return story.articles.reduce(
    (best, article) => Math.max(best, rank.get(article.sourceId) ?? 0),
    0,
  )
}

/**
 * Combina a coleta do dia com o dataset anterior.
 *
 * A URL do artigo é a chave de continuidade: uma história nova que compartilha
 * qualquer matéria com uma antiga herda `id` e `slug` (links não quebram) e
 * recebe a união dos artigos. Histórias antigas sem sobreposição são mantidas
 * enquanto o artigo mais recente estiver dentro da janela de retenção.
 */
export function mergeStories(
  fresh: Story[],
  previous: Story[],
  sources: Source[],
  options: MergeOptions = {},
): MergeResult {
  const now = options.now ?? new Date().toISOString()
  const retentionDays = options.retentionDays ?? 7
  const maxStories = options.maxStories ?? 200
  const maxArticlesPerStory = options.maxArticlesPerStory ?? 12
  const cutoff = Date.parse(now) - retentionDays * 86_400_000

  const kept = previous.filter((story) => newestArticleAt(story) >= cutoff)
  const expiredStories = previous.length - kept.length

  const oldByUrl = new Map<string, Story>()
  for (const story of kept) {
    for (const article of story.articles) oldByUrl.set(article.url, story)
  }

  const consumed = new Set<string>()
  let mergedStories = 0

  const mergedFresh = fresh.map((story) => {
    const matches = new Map<string, Story>()
    for (const article of story.articles) {
      const previousStory = oldByUrl.get(article.url)
      if (previousStory && !consumed.has(previousStory.id)) {
        matches.set(previousStory.id, previousStory)
      }
    }

    if (matches.size === 0) {
      return { ...story, articles: dedupeArticles(story.articles, maxArticlesPerStory) }
    }

    const base = [...matches.values()].sort(
      (left, right) => right.articles.length - left.articles.length,
    )[0]!

    const union = [...story.articles]
    for (const previousStory of matches.values()) {
      union.push(...previousStory.articles)
      consumed.add(previousStory.id)
      for (const article of previousStory.articles) oldByUrl.delete(article.url)
    }
    mergedStories += 1

    return {
      ...story,
      id: base.id,
      slug: base.slug,
      articles: dedupeArticles(union, maxArticlesPerStory),
      updatedAt: now,
    }
  })

  const retained = kept.filter((story) => !consumed.has(story.id))
  const rank = new Map(sources.map((source) => [source.id, RELIABILITY_RANK[source.reliability]]))

  const stories = [...mergedFresh, ...retained]
    .sort((left, right) => {
      const countDiff = right.articles.length - left.articles.length
      if (countDiff !== 0) return countDiff
      return bestReliability(right, rank) - bestReliability(left, rank)
    })
    .slice(0, maxStories)

  return {
    stories,
    freshStories: fresh.length,
    mergedStories,
    retainedStories: retained.length,
    expiredStories,
  }
}
