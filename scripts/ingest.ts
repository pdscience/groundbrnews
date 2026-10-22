import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { SOURCES } from '@/data/sources'
import { FEEDS } from '@/data/feeds'
import { buildStories, resolveArticleSources } from '@/lib/ingest/build'
import { clusterItems } from '@/lib/ingest/cluster'
import { fetchText } from '@/lib/ingest/http'
import { dedupeArticles, normalizeArticle } from '@/lib/ingest/normalize'
import { parseFeed } from '@/lib/ingest/rss'
import type { Article } from '@/types/analysis'

interface Args {
  dryRun: boolean
  windowHours: number
  maxStories: number
  only: string[]
  outDir: string
  concurrency: number
  threshold: number
  show: number
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    dryRun: false,
    windowHours: 96,
    maxStories: 80,
    only: [],
    outDir: path.resolve(process.cwd(), 'src/data/generated'),
    concurrency: 4,
    threshold: 0.32,
    show: 8,
  }

  for (const raw of argv) {
    if (raw === '--dry-run') args.dryRun = true
    else if (raw.startsWith('--window=')) args.windowHours = Number(raw.slice(9)) || args.windowHours
    else if (raw.startsWith('--stories=')) args.maxStories = Number(raw.slice(10)) || args.maxStories
    else if (raw.startsWith('--out=')) args.outDir = path.resolve(process.cwd(), raw.slice(6))
    else if (raw.startsWith('--concurrency=')) args.concurrency = Number(raw.slice(14)) || 4
    else if (raw.startsWith('--threshold=')) args.threshold = Number(raw.slice(12)) || args.threshold
    else if (raw.startsWith('--show=')) args.show = Number(raw.slice(7)) || args.show
    else if (raw.startsWith('--source=')) {
      args.only = raw
        .slice(9)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    }
  }

  return args
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length) as R[]
  let cursor = 0

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await task(items[index]!, index)
    }
  })

  await Promise.all(workers)
  return results
}

interface FeedReport {
  sourceId: string
  ok: boolean
  items: number
  error?: string
}

interface FeedOutcome extends FeedReport {
  articles: Article[]
}

async function collect(args: Args): Promise<{ articles: Article[]; reports: FeedReport[] }> {
  const sourceIds = Object.keys(FEEDS).filter(
    (id) => args.only.length === 0 || args.only.includes(id),
  )
  const now = new Date().toISOString()

  const outcomes = await mapLimit(sourceIds, args.concurrency, async (sourceId): Promise<FeedOutcome> => {
    const url = FEEDS[sourceId]!
    try {
      const response = await fetchText(url, { timeoutMs: 15_000, retries: 1, minIntervalMs: 600 })
      const raw = parseFeed(response.body, sourceId, 60, response.url)
      if (raw.length === 0) {
        return { sourceId, ok: false, items: 0, error: 'feed sem itens', articles: [] }
      }

      const articles = raw
        .map((item) => normalizeArticle(item, SOURCES, { now }))
        .filter((article): article is Article => Boolean(article))

      return { sourceId, ok: true, items: articles.length, articles }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { sourceId, ok: false, items: 0, error: message, articles: [] }
    }
  })

  return {
    articles: outcomes.flatMap((outcome) => outcome.articles),
    reports: outcomes.map(({ sourceId, ok, items, error }) => ({
      sourceId,
      ok,
      items,
      ...(error ? { error } : {}),
    })),
  }
}

function withinWindow(articles: Article[], windowHours: number): Article[] {
  const now = Date.now()
  const youngest = now + 24 * 3_600_000
  const oldest = now - windowHours * 3_600_000
  return articles.filter((article) => {
    const time = Date.parse(article.publishedAt)
    return Number.isFinite(time) && time >= oldest && time <= youngest
  })
}

function run(articles: Article[], args: Args): { stories: ReturnType<typeof buildStories>; stats: Record<string, number> } {
  const resolved = resolveArticleSources(articles, SOURCES)
  const unique = dedupeArticles(resolved)

  const clusters = clusterItems(
    unique.map((article) => ({
      id: article.id,
      sourceId: article.sourceId,
      title: article.title,
      excerpt: article.excerpt,
      publishedAt: article.publishedAt,
    })),
    { threshold: args.threshold, maxHoursApart: 48, maxSpanHours: 72, maxClusterSize: 16 },
  )

  const stories = buildStories(unique, clusters.groups, SOURCES, {
    maxStories: args.maxStories,
    maxArticlesPerStory: 12,
  })

  return {
    stories,
    stats: {
      artigos: unique.length,
      pares: clusters.pairsEvaluated,
      grupos: clusters.groups.length,
      historias: stories.length,
    },
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const startedAt = Date.now()

  console.log(`\nChão Brasil · coleta de notícias`)
  console.log(
    `janela: ${args.windowHours}h · feeds: ${Object.keys(FEEDS).length} · concorrência: ${args.concurrency}${args.dryRun ? ' · DRY-RUN' : ''}\n`,
  )

  const { articles, reports } = await collect(args)

  const failed = reports.filter((report) => !report.ok)
  for (const report of reports) {
    const mark = report.ok ? 'ok  ' : 'erro'
    const detail = report.ok ? `${report.items} itens` : (report.error ?? '')
    console.log(`  ${mark} ${report.sourceId.padEnd(20)} ${detail}`)
  }

  let filtered = withinWindow(articles, args.windowHours)
  if (filtered.length === 0 && articles.length > 0) {
    console.log(`\nNenhum artigo nas últimas ${args.windowHours}h; ampliando para 168h.`)
    filtered = withinWindow(articles, 168)
  }

  const { stories, stats } = run(filtered, args)

  const sourceIds = new Set(stories.flatMap((story) => story.articles.map((a) => a.sourceId)))

  console.log(`\n  feeds ok:            ${reports.length - failed.length}/${reports.length}`)
  console.log(`  artigos brutos:      ${articles.length}`)
  console.log(`  artigos na janela:   ${filtered.length}`)
  console.log(`  artigos únicos:      ${stats.artigos}`)
  console.log(`  pares avaliados:     ${stats.pares}`)
  console.log(`  grupos formados:     ${stats.grupos}`)
  console.log(`  histórias com 2+:    ${stats.historias}`)
  console.log(`  veículos cobrindo:   ${sourceIds.size}`)
  console.log(`  tempo:               ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)

  if (stories.length === 0) {
    console.error('\nNenhuma história com cobertura cruzada. Nada foi gravado.')
    process.exitCode = 1
    return
  }

  if (args.dryRun) {
    console.log('\nDRY-RUN: nada foi gravado.')
    for (const story of stories.slice(0, args.show)) {
      const sources = story.articles.map((a) => a.sourceId).join(', ')
      console.log(`  · [${story.articles.length}] ${story.title}`)
      console.log(`    ${story.theme} · ${story.region} · ${sources}`)
    }
    return
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    windowHours: args.windowHours,
    stories: stories.length,
    articles: filtered.length,
    sourcesWithData: sourceIds.size,
    feeds: reports,
  }

  await mkdir(args.outDir, { recursive: true })
  await writeFile(path.join(args.outDir, 'stories.json'), `${JSON.stringify(stories, null, 2)}\n`, 'utf8')
  await writeFile(path.join(args.outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  console.log(`\nGravado em ${path.relative(process.cwd(), args.outDir)}/`)
}

main().catch((error) => {
  console.error('\nFalha na coleta:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
