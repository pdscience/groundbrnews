import { getLens } from '@/data/levels'
import { formatBucketLabel, formatPercent } from './format'
import type { Article, Level, LensId, Source, Story } from '@/types/analysis'

export interface DistributionSlice {
  level: Level
  count: number
  share: number
}

export interface TimelinePoint {
  bucket: string
  label: string
  total: number
  byLevel: Record<string, number>
}

export type AsymmetrySeverity = 'none' | 'moderate' | 'high'

export interface Asymmetry {
  flagged: boolean
  severity: AsymmetrySeverity
  dominantLevel: Level
  dominantShare: number
  oppositeShare: number
  secondShare: number
  sourceCount: number
  /** Texto legível explicando por que a história foi sinalizada. */
  reason: string
}

const MIN_SOURCES = 5

/**
 * Limiares da lente de oposição (ideologia).
 *
 * `opposite <= 30%` implica `dominant >= 70%`, o que torna "moderada"
 * (55%–80%) e "alta" (>= 80%) ambas alcançáveis. Com um piso de 25% no
 * oposto a severidade moderada seria matematicamente impossível.
 */
const IDEOLOGY_MIN_DOMINANT = 0.55
const IDEOLOGY_MAX_OPPOSITE = 0.3
const IDEOLOGY_HIGH = 0.8

/** Limiares das lentes de concentração (tipo de veículo, região). */
const CONCENTRATION_MIN_DOMINANT = 0.6
const CONCENTRATION_MAX_SECOND = 0.2
const CONCENTRATION_HIGH = 0.8

export function distribution(
  story: Story,
  sources: Map<string, Source>,
  lens: LensId,
): DistributionSlice[] {
  const levels = getLens(lens).levels
  const counts = new Map<Level['id'], number>(levels.map((l) => [l.id, 0]))

  for (const article of story.articles) {
    const source = sources.get(article.sourceId)
    if (!source) continue
    const levelId = source.ratings[lens]
    counts.set(levelId, (counts.get(levelId) ?? 0) + 1)
  }

  const total = [...counts.values()].reduce((acc, n) => acc + n, 0)
  return levels.map((level) => {
    const count = counts.get(level.id) ?? 0
    return { level, count, share: total === 0 ? 0 : count / total }
  })
}

export function dominantSlice(slices: DistributionSlice[]): DistributionSlice | null {
  if (slices.length === 0) return null
  return slices.reduce((best, slice) => (slice.count > best.count ? slice : best))
}

export function asymmetry(
  story: Story,
  sources: Map<string, Source>,
  lens: LensId,
): Asymmetry {
  const lensDef = getLens(lens)
  const slices = distribution(story, sources, lens)
  const sourceCount = slices.reduce((acc, s) => acc + s.count, 0)
  const dominant = dominantSlice(slices)
  const fallback = lensDef.levels[0]

  if (!dominant || sourceCount === 0 || !fallback) {
    return {
      flagged: false,
      severity: 'none',
      dominantLevel: fallback ?? { id: 'center', label: 'Centro', shortLabel: 'C', color: '#a6adb8', order: 0 },
      dominantShare: 0,
      oppositeShare: 0,
      secondShare: 0,
      sourceCount: 0,
      reason: 'Sem cobertura suficiente para avaliar assimetria.',
    }
  }

  const second = slices
    .filter((s) => s.level.id !== dominant.level.id)
    .reduce((best, s) => (s.count > best.count ? s : best))

  if (lensDef.opposition) {
    const { left, right } = lensDef.opposition
    const leftCount = slices
      .filter((s) => left.includes(s.level.id))
      .reduce((acc, s) => acc + s.count, 0)
    const rightCount = slices
      .filter((s) => right.includes(s.level.id))
      .reduce((acc, s) => acc + s.count, 0)
    const sidedTotal = leftCount + rightCount

    if (sidedTotal === 0) {
      return {
        flagged: false,
        severity: 'none',
        dominantLevel: dominant.level,
        dominantShare: 0,
        oppositeShare: 0,
        secondShare: second.share,
        sourceCount,
        reason: 'Cobertura concentrada apenas em veículos centrais.',
      }
    }

    const dominantCount = Math.max(leftCount, rightCount)
    const oppositeCount = Math.min(leftCount, rightCount)
    const dominantShare = dominantCount / sidedTotal
    const oppositeShare = oppositeCount / sidedTotal
    const dominantLabel = dominantCount === leftCount ? 'à esquerda' : 'à direita'
    const flagged =
      sourceCount >= MIN_SOURCES &&
      dominantShare >= IDEOLOGY_MIN_DOMINANT &&
      oppositeShare <= IDEOLOGY_MAX_OPPOSITE
    const severity: AsymmetrySeverity =
      !flagged ? 'none' : dominantShare >= IDEOLOGY_HIGH ? 'high' : 'moderate'
    const reason = flagged
      ? `${formatPercent(dominantShare)} da cobertura está ${dominantLabel} e apenas ${formatPercent(
          oppositeShare,
        )} do lado oposto, em ${sourceCount} veículos.`
      : `Cobertura dividida: ${formatPercent(dominantShare)} de um lado e ${formatPercent(
          oppositeShare,
        )} do outro.`

    return {
      flagged,
      severity,
      dominantLevel: dominant.level,
      dominantShare,
      oppositeShare,
      secondShare: second.share,
      sourceCount,
      reason,
    }
  }

  const dominantShare = dominant.share
  const oppositeShare = 0
  const secondShare = second.share
  const flagged =
    sourceCount >= MIN_SOURCES &&
    dominantShare >= CONCENTRATION_MIN_DOMINANT &&
    secondShare <= CONCENTRATION_MAX_SECOND
  const severity: AsymmetrySeverity =
    !flagged ? 'none' : dominantShare >= CONCENTRATION_HIGH ? 'high' : 'moderate'
  const reason = flagged
    ? `${formatPercent(dominantShare)} da cobertura vem de veículos de um mesmo grupo (${
        dominant.level.label
      }), sem contraponto de outras categorias.`
    : `A cobertura está distribuída entre ${
        slices.filter((s) => s.count > 0).length
      } categorias.`

  return {
    flagged,
    severity,
    dominantLevel: dominant.level,
    dominantShare,
    oppositeShare,
    secondShare,
    sourceCount,
    reason,
  }
}

const HOUR = 3_600_000

export function coverageTimeline(
  story: Story,
  sources: Map<string, Source>,
  lens: LensId,
): { granularity: 'hour' | 'day'; points: TimelinePoint[] } {
  const dated = story.articles
    .filter((a) => sources.has(a.sourceId))
    .map((a) => ({ article: a, time: Date.parse(a.publishedAt) }))
    .filter((d) => Number.isFinite(d.time))
    .sort((a, b) => a.time - b.time)

  if (dated.length === 0) return { granularity: 'day', points: [] }

  const first = dated[0]!
  const last = dated[dated.length - 1]!
  const span = last.time - first.time
  const granularity: 'hour' | 'day' = span <= 36 * HOUR ? 'hour' : 'day'
  const step = granularity === 'hour' ? HOUR : 24 * HOUR

  const toBucket = (time: number): string => {
    const iso = new Date(time).toISOString()
    return granularity === 'hour' ? `${iso.slice(0, 13)}` : iso.slice(0, 10)
  }

  const counts = new Map<string, { total: number; byLevel: Record<string, number> }>()
  for (const { article, time } of dated) {
    const bucket = toBucket(time)
    const levelId = sources.get(article.sourceId)!.ratings[lens]
    const entry = counts.get(bucket) ?? { total: 0, byLevel: {} }
    entry.total += 1
    entry.byLevel[levelId] = (entry.byLevel[levelId] ?? 0) + 1
    counts.set(bucket, entry)
  }

  const points: TimelinePoint[] = []
  for (let t = first.time; t <= last.time; t += step) {
    const bucket = toBucket(t)
    const entry = counts.get(bucket) ?? { total: 0, byLevel: {} }
    points.push({
      bucket,
      label: formatBucketLabel(bucket, granularity),
      total: entry.total,
      byLevel: entry.byLevel,
    })
  }

  return { granularity, points }
}

export function firstReported(story: Story): Article | null {
  if (story.articles.length === 0) return null
  return [...story.articles].sort(
    (a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt),
  )[0]!
}

export function groupArticlesByLevel(
  story: Story,
  sources: Map<string, Source>,
  lens: LensId,
): Map<string, Article[]> {
  const grouped = new Map<string, Article[]>()
  for (const article of story.articles) {
    const source = sources.get(article.sourceId)
    if (!source) continue
    const levelId = source.ratings[lens]
    const list = grouped.get(levelId) ?? []
    list.push(article)
    grouped.set(levelId, list)
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt))
  }
  return grouped
}

export function compareSources(
  story: Story,
  sources: Map<string, Source>,
  lens: LensId,
  sourceA: string,
  sourceB: string,
): { a: Article[]; b: Article[] } {
  const a: Article[] = []
  const b: Article[] = []
  for (const article of story.articles) {
    if (article.sourceId === sourceA) a.push(article)
    if (article.sourceId === sourceB) b.push(article)
  }
  a.sort((x, y) => Date.parse(x.publishedAt) - Date.parse(y.publishedAt))
  b.sort((x, y) => Date.parse(x.publishedAt) - Date.parse(y.publishedAt))
  return { a, b }
}

/** Veículos distintos que publicaram sobre a história, na ordem da primeira publicação. */
export function storySources(story: Story, sources: Map<string, Source>): Source[] {
  const ordered = firstReported(story)
  const seen = new Set<string>()
  const result: Source[] = []

  if (ordered) {
    const first = sources.get(ordered.sourceId)
    if (first) {
      seen.add(first.id)
      result.push(first)
    }
  }

  const rest = [...story.articles]
    .sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt))
    .map((a) => sources.get(a.sourceId))
    .filter((s): s is Source => Boolean(s) && !seen.has(s!.id))

  for (const source of rest) {
    seen.add(source.id)
    result.push(source)
  }

  return result
}
