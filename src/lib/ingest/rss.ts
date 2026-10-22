export interface RawArticle {
  sourceId: string
  title: string
  excerpt: string
  url: string
  publishedAt: string
  image?: string
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  ccedil: 'ç',
  Ccedil: 'Ç',
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  atilde: 'ã',
  otilde: 'õ',
  ccedil_upper: 'Ç',
  ecirc: 'ê',
  ocirc: 'ô',
  uuml: 'ü',
  ordm: 'º',
  deg: '°',
  middot: '·',
}

export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z][a-z0-9]+);/gi, (match, name: string) => {
      const resolved = NAMED_ENTITIES[name] ?? NAMED_ENTITIES[name.toLowerCase()]
      return resolved ?? match
    })
}

export function stripHtml(value: string): string {
  let text = value
  for (let pass = 0; pass < 2; pass += 1) {
    text = decodeEntities(text)
    text = text.replace(/<[^>]*>/g, ' ')
  }
  return text
    .replace(/\s*(?:leia mais|saiba mais|continue lendo|confira (?:a|o) [^.]{0,40})\.?\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function unwrap(value: string): string {
  const cdata = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(value)
  return (cdata?.[1] ?? value).trim()
}

function clean(value: string | undefined): string {
  if (!value) return ''
  return stripHtml(unwrap(value))
}

function blocks(xml: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')
  return [...xml.matchAll(pattern)].map((match) => match[1] ?? '')
}

function firstTag(block: string, tags: string[]): string | undefined {
  for (const tag of tags) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
    const match = pattern.exec(block)
    if (match?.[1] !== undefined) return match[1]
  }
  return undefined
}

function attrIn(block: string, tag: string, attr: string): string | undefined {
  const pattern = new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']+)["']`, 'i')
  return pattern.exec(block)?.[1]
}

function linkOf(block: string): string | undefined {
  const direct = clean(firstTag(block, ['link', 'guid', 'loc']))
  if (/^https?:\/\//i.test(direct)) return direct
  if (direct.startsWith('/') || direct.startsWith('./')) return direct

  const tags = [...block.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0])
  const alternate = tags.find((tag) => /rel=["']?alternate/i.test(tag))
  const chosen = alternate ?? tags[0]
  if (chosen) {
    const href = /href=["']([^"']+)["']/i.exec(chosen)?.[1]
    if (href) return href
  }

  const guid = attrIn(block, 'guid', 'isPermaLink')
  return guid
}

function imageOf(block: string, excerptHtml: string): string | undefined {
  const candidates = [
    attrIn(block, 'media:content', 'url'),
    attrIn(block, 'media:thumbnail', 'url'),
    attrIn(block, 'enclosure', 'url'),
    attrIn(block, 'itunes:image', 'url'),
    clean(firstTag(block, ['image:loc'])) || undefined,
  ]

  for (const candidate of candidates) {
    if (candidate && /^https?:\/\//i.test(candidate)) return candidate
  }

  const inline = /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(excerptHtml)?.[1]
  if (inline && /^https?:\/\//i.test(inline)) return inline

  return undefined
}

function dateOf(block: string): string {
  const raw = clean(
    firstTag(block, [
      'pubDate',
      'published',
      'updated',
      'dc:date',
      'news:publication_date',
      'date',
    ]),
  )
  if (!raw) return ''
  const parsed = Date.parse(raw)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : ''
}

function descriptor(xml: string): { kind: 'rss' | 'atom' | 'sitemap' | 'unknown'; tag: string } {
  if (/<urlset\b/i.test(xml) || /<url\b[^>]*>[\s\S]*?<loc>/i.test(xml)) {
    return { kind: 'sitemap', tag: 'url' }
  }
  if (/<feed\b/i.test(xml)) return { kind: 'atom', tag: 'entry' }
  if (/<rss\b/i.test(xml) || /<channel\b/i.test(xml)) return { kind: 'rss', tag: 'item' }
  if (/<entry\b/i.test(xml)) return { kind: 'atom', tag: 'entry' }
  if (/<item\b/i.test(xml)) return { kind: 'rss', tag: 'item' }
  return { kind: 'unknown', tag: 'item' }
}

export function parseFeed(
  xml: string,
  sourceId: string,
  maxItems = 80,
  baseUrl?: string,
): RawArticle[] {
  const { tag } = descriptor(xml)
  const chunks = blocks(xml, tag)
  const result: RawArticle[] = []
  const seen = new Set<string>()

  for (const chunk of chunks.slice(0, maxItems)) {
    const titleRaw = firstTag(chunk, ['title', 'news:title'])
    const title = clean(titleRaw)
    const rawUrl = linkOf(chunk)
    if (!title || !rawUrl) continue

    let url: string
    try {
      url = baseUrl ? new URL(rawUrl, baseUrl).toString() : rawUrl
    } catch {
      continue
    }
    if (!/^https?:\/\//i.test(url)) continue
    if (seen.has(url)) continue
    seen.add(url)

    const descriptionHtml = firstTag(chunk, [
      'description',
      'summary',
      'content:encoded',
      'content',
    ])
    const excerpt = clean(descriptionHtml).slice(0, 400)
    const image = imageOf(chunk, descriptionHtml ?? '')

    result.push({
      sourceId,
      title,
      excerpt,
      url,
      publishedAt: dateOf(chunk),
      ...(image ? { image } : {}),
    })
  }

  return result
}
