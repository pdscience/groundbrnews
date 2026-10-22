import type { Article, Story } from '@/types/analysis'
import { IDEOLOGY_LEVELS, REGION_LEVELS, VEHICLE_TYPE_LEVELS } from '@/types/analysis'

const STANCES = new Set(['support', 'critical', 'neutral', 'mixed'])

const storyModules = import.meta.glob<{ default: unknown }>('./stories.json', { eager: true })
const manifestModules = import.meta.glob<{ default: unknown }>('./manifest.json', { eager: true })

const rawStories: unknown = Object.values(storyModules)[0]?.default
const rawManifest: unknown = Object.values(manifestModules)[0]?.default

export interface FeedRun {
  sourceId: string
  ok: boolean
  items: number
  error?: string
}

export interface IngestManifest {
  generatedAt: string
  windowHours: number
  stories: number
  articles: number
  sourcesWithData: number
  feeds: FeedRun[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isArticle(value: unknown): value is Article {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isString(value.sourceId) &&
    isString(value.title) &&
    typeof value.excerpt === 'string' &&
    isString(value.url) &&
    isString(value.publishedAt) &&
    typeof value.stance === 'string' &&
    STANCES.has(value.stance) &&
    (value.image === undefined || typeof value.image === 'string')
  )
}

function isStory(value: unknown): value is Story {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isString(value.slug) &&
    isString(value.title) &&
    Array.isArray(value.summary) &&
    value.summary.every((item) => typeof item === 'string') &&
    typeof value.debate === 'string' &&
    isString(value.theme) &&
    typeof value.region === 'string' &&
    REGION_LEVELS.includes(value.region as (typeof REGION_LEVELS)[number]) &&
    isString(value.state) &&
    Array.isArray(value.articles) &&
    value.articles.length >= 2 &&
    value.articles.every(isArticle)
  )
}

export function parseStories(value: unknown): Story[] {
  if (!Array.isArray(value)) return []
  return value.filter(isStory)
}

export function parseManifest(value: unknown): IngestManifest | null {
  if (!isRecord(value)) return null
  if (!isString(value.generatedAt)) return null
  if (!Array.isArray(value.feeds)) return null
  return value as unknown as IngestManifest
}

export const GENERATED_STORIES: Story[] = parseStories(rawStories)
export const GENERATED_MANIFEST: IngestManifest | null = parseManifest(rawManifest)
export const HAS_GENERATED_DATA = GENERATED_STORIES.length > 0

export function validateSources(stories: Story[], knownIds: Set<string>): Story[] {
  return stories
    .map((story) => ({
      ...story,
      articles: story.articles.filter((article) => knownIds.has(article.sourceId)),
    }))
    .filter((story) => story.articles.length >= 2)
}

export const KNOWN_LEVELS = {
  ideology: IDEOLOGY_LEVELS,
  vehicleType: VEHICLE_TYPE_LEVELS,
  region: REGION_LEVELS,
} as const
