import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { SOURCES } from '@/data/sources'
import { FEEDS } from '@/data/feeds'
import { buildStories, resolveArticleSources } from '@/lib/ingest/build'
import { clusterItems } from '@/lib/ingest/cluster'
import { fetchText } from '@/lib/ingest/http'
import { dedupeArticles, normalizeArticle } from '@/lib/ingest/normalize'
import { mergeStories } from '@/lib/ingest/merge'
import { parseFeed } from '@/lib/ingest/rss'
import type { Article, Story } from '@/types/analysis'

interface Args {
  dryRun: boolean
  windowHours: number
  maxStories: number
  only: string[]
  outDir: string
  concurrency: number
  threshold: number
  show: number
  retentionDays: number
  maxTotal: number
  force: boolean
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
    retentionDays: 7,
    maxTotal: 200,
    force: false,
  }

  for (const raw of argv) {
    if (raw === '--dry-run') args.dryRun = true
    else if (raw.startsWith('--window=')) args.windowHours = Number(raw.slice(9)) || args.windowHours
    else if (raw.startsWith('--stories=')) args.maxStories = Number(raw.slice(10)) || args.maxStories
    else if (raw.startsWith('--out=')) args.outDir = path.resolve(process.cwd(), raw.slice(6))
    else if (raw.startsWith('--concurrency=')) args.concurrency = Number(raw.slice(14)) || 4
    else if (raw.startsWith('--threshold=')) args.threshold = Number(raw.slice(12)) || args.threshold
    else if (raw.startsWith('--show=')) args.show = Number(raw.slice(7)) || args.show
    else if (raw.startsWith('--retention-days=')) {
      args.retentionDays = Number(raw.slice(17)) || args.retentionDays
    } else if (raw.startsWith('--max-total=')) args.maxTotal = Number(raw.slice(12)) || args.maxTotal
    else if (raw === '--force') args.force = true
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

async function collect(
  args: Args,
  onlyOverride?: string[],
): Promise<{ articles: Article[]; reports: FeedReport[] }> {
  const selected = onlyOverride ?? args.only
  const sourceIds = Object.keys(FEEDS).filter(
    (id) => selected.length === 0 || selected.includes(id),
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadPrevious(outDir: string): Promise<Story[]> {
  try {
    const raw = await readFile(path.join(outDir, 'stories.json'), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Story[]) : []
  } catch {
    return []
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const startedAt = Date.now()

  console.log(`\nGroundBrNews · coleta de notícias`)
  console.log(
    `janela: ${args.windowHours}h · feeds: ${Object.keys(FEEDS).length} · concorrência: ${args.concurrency}${args.dryRun ? ' · DRY-RUN' : ''}\n`,
  )

  let { articles, reports } = await collect(args)
  let failed = reports.filter((report) => !report.ok)

  if (failed.length > 0) {
    const retryIds = failed.map((report) => report.sourceId)
    console.log(`\n${retryIds.length} feed(s) falharam; nova tentativa em 5s: ${retryIds.join(', ')}`)
    await sleep(5_000)
    const retried = await collect(args, retryIds)
    const retryReports = new Map(retried.reports.map((report) => [report.sourceId, report]))
    reports = reports.map((report) => retryReports.get(report.sourceId) ?? report)
    const retriedIds = new Set(retried.articles.map((article) => article.sourceId))
    articles = [
      ...articles.filter((article) => !retriedIds.has(article.sourceId)),
      ...retried.articles,
    ]
    failed = reports.filter((report) => !report.ok)
  }
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

  const previous = await loadPrevious(args.outDir)
  const merged = mergeStories(stories, previous, SOURCES, {
    retentionDays: args.retentionDays,
    maxStories: args.maxTotal,
    maxArticlesPerStory: 12,
  })
  const dataset = merged.stories
  const sourceIds = new Set(dataset.flatMap((story) => story.articles.map((a) => a.sourceId)))

  console.log(`\n  feeds ok:            ${reports.length - failed.length}/${reports.length}`)
  console.log(`  artigos brutos:      ${articles.length}`)
  console.log(`  artigos na janela:   ${filtered.length}`)
  console.log(`  artigos únicos:      ${stats.artigos}`)
  console.log(`  pares avaliados:     ${stats.pares}`)
  console.log(`  grupos formados:     ${stats.grupos}`)
  console.log(`  histórias novas:     ${stats.historias}`)
  console.log(`  absorvidas:          ${merged.mergedStories}`)
  console.log(`  mantidas (${args.retentionDays}d):      ${merged.retainedStories}`)
  console.log(`  expiradas:           ${merged.expiredStories}`)
  console.log(`  no dataset:          ${dataset.length}`)
  console.log(`  veículos cobrindo:   ${sourceIds.size}`)
  console.log(`  tempo:               ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)

  if (stories.length === 0) {
    console.error('\nNenhuma história com cobertura cruzada. Nada foi gravado.')
    process.exitCode = 1
    return
  }

  const feedsOk = reports.length - failed.length
  if (!args.force && !args.dryRun && args.only.length === 0 && feedsOk < Math.ceil(reports.length / 2)) {
    console.error(
      `\nApenas ${feedsOk}/${reports.length} feeds responderam; nada foi gravado (use --force para ignorar).`,
    )
    process.exitCode = 1
    return
  }

  if (args.dryRun) {
    console.log('\nDRY-RUN: nada foi gravado.')
    for (const story of dataset.slice(0, args.show)) {
      const sources = story.articles.map((a) => a.sourceId).join(', ')
      console.log(`  · [${story.articles.length}] ${story.title}`)
      console.log(`    ${story.theme} · ${story.region} · ${sources}`)
    }
    return
  }

  const datasetArticles = dataset.flatMap((story) => story.articles)
  const oldest = datasetArticles.reduce(
    (value, article) => Math.min(value, Date.parse(article.publishedAt)),
    Number.POSITIVE_INFINITY,
  )

  const manifest = {
    generatedAt: new Date().toISOString(),
    windowHours: args.windowHours,
    retentionDays: args.retentionDays,
    stories: dataset.length,
    freshStories: stories.length,
    mergedStories: merged.mergedStories,
    retainedStories: merged.retainedStories,
    expiredStories: merged.expiredStories,
    articles: filtered.length,
    datasetArticles: datasetArticles.length,
    oldestArticleAt: Number.isFinite(oldest) ? new Date(oldest).toISOString() : null,
    sourcesWithData: sourceIds.size,
    feeds: reports,
  }

  await mkdir(args.outDir, { recursive: true })
  await writeFile(path.join(args.outDir, 'stories.json'), `${JSON.stringify(dataset, null, 2)}\n`, 'utf8')
  await writeFile(path.join(args.outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  console.log(`\nGravado em ${path.relative(process.cwd(), args.outDir)}/`)
}

main().catch((error) => {
  console.error('\nFalha na coleta:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
