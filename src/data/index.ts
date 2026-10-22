import type { Source, Story } from '@/types/analysis'
import { SOURCES as SOURCES_RAW } from './sources'
import { STORIES as STORIES_RAW } from './stories'
import {
  GENERATED_MANIFEST,
  GENERATED_STORIES,
  HAS_GENERATED_DATA,
  validateSources,
} from './generated'

export const SOURCES: Source[] = SOURCES_RAW
export const CURATED_STORIES: Story[] = STORIES_RAW

const knownSourceIds = new Set(SOURCES.map((source) => source.id))
const generated = HAS_GENERATED_DATA ? validateSources(GENERATED_STORIES, knownSourceIds) : []

export const STORIES: Story[] = generated.length > 0 ? generated : CURATED_STORIES

export const DATASET_KIND: 'real' | 'demonstrativo' =
  generated.length > 0 ? 'real' : 'demonstrativo'

export const DATASET_META = generated.length > 0 ? GENERATED_MANIFEST : null

export const COVERED_SOURCES: string[] = [
  ...new Set(STORIES.flatMap((story) => story.articles.map((article) => article.sourceId))),
].sort()

export const SOURCES_BY_ID: Map<string, Source> = new Map(SOURCES.map((s) => [s.id, s]))
export const STORIES_BY_SLUG: Map<string, Story> = new Map(STORIES.map((s) => [s.slug, s]))

export const THEMES: string[] = [...new Set(STORIES.map((s) => s.theme))].sort()

export { BRAND } from './brand'
export { FEEDS } from './feeds'
export { LENSES, LENS_ORDER, getLens, getLevel } from './levels'
