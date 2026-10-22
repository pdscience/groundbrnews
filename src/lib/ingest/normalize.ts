import type { Article, Source } from '@/types/analysis'
import type { RawArticle } from './rss'

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'igshid',
  'ref',
]

export function canonicalHost(host: string): string {
  return host.toLowerCase().replace(/^www\d*\./, '').replace(/:\d+$/, '')
}

export function canonicalUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (!/^https?:$/.test(url.protocol)) return null
    url.hash = ''
    for (const param of TRACKING_PARAMS) url.searchParams.delete(param)
    url.host = canonicalHost(url.host)
    return url.toString()
  } catch {
    return null
  }
}

export function hostFromUrl(value: string): string | null {
  try {
    return canonicalHost(new URL(value).host)
  } catch {
    return null
  }
}

export function resolveSourceId(value: string, sources: Source[]): string | null {
  const host = hostFromUrl(value)
  if (!host) return null

  const ordered = [...sources].sort((a, b) => b.domain.length - a.domain.length)

  for (const source of ordered) {
    const domain = canonicalHost(source.domain)
    if (host === domain || host.endsWith(`.${domain}`)) return source.id
  }

  return null
}

export function stableId(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 8)
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

const TITLE_PREFIXES =
  /^(?:\[(?:video|vídeo|fotos|podcast|exclusivo|ao vivo|análise|opinião|entrevista)\]|\((?:video|vídeo|fotos|podcast|exclusivo|ao vivo)\))\s*/i

const TITLE_LABEL = /^(?:vídeo|video|ao vivo|exclusivo|entenda|saiba|veja|assista|ouça|leia|confira|análise|opinião|podcast)\s*[:–—-]\s*/i

const TITLE_SEPARATOR = /\s*[|｜]\s*[^|｜]{2,40}$/

export function cleanTitle(value: string): string {
  let title = value.replace(/\s+/g, ' ').trim()
  title = title.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim()
  title = title.replace(TITLE_PREFIXES, '')
  title = title.replace(TITLE_LABEL, '')
  title = title.replace(TITLE_SEPARATOR, '')
  return title.trim()
}

export interface NormalizeOptions {
  now?: string
}

export function normalizeArticle(
  raw: RawArticle,
  sources: Source[],
  options: NormalizeOptions = {},
): Article | null {
  const title = cleanTitle(raw.title)
  if (title.length < 12) return null

  const url = canonicalUrl(raw.url)
  if (!url) return null

  const sourceId = resolveSourceId(url, sources) ?? raw.sourceId
  const publishedAt = raw.publishedAt || options.now || new Date().toISOString()

  return {
    id: `a-${stableId(url)}`,
    sourceId,
    title,
    excerpt: raw.excerpt.replace(/\s+/g, ' ').trim().slice(0, 400),
    url,
    publishedAt,
    stance: 'neutral',
    stanceEstimated: true,
    ...(raw.image ? { image: raw.image } : {}),
  }
}

export function dedupeArticles(articles: Article[]): Article[] {
  const seen = new Set<string>()
  const result: Article[] = []
  for (const article of articles) {
    const key = canonicalUrl(article.url) ?? article.url
    if (seen.has(key)) continue
    seen.add(key)
    result.push(article)
  }
  return result
}
