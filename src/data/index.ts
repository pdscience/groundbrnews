import type { Source, Story } from '@/types/analysis'
import { SOURCES as SOURCES_RAW } from './sources'
import { STORIES as STORIES_RAW } from './stories'

export const SOURCES: Source[] = SOURCES_RAW
export const STORIES: Story[] = STORIES_RAW

export const SOURCES_BY_ID: Map<string, Source> = new Map(SOURCES.map((s) => [s.id, s]))
export const STORIES_BY_SLUG: Map<string, Story> = new Map(STORIES.map((s) => [s.slug, s]))

export const THEMES: string[] = [...new Set(STORIES.map((s) => s.theme))].sort()

export { BRAND, DATASET_KIND } from './brand'
export { LENSES, LENS_ORDER, getLens, getLevel } from './levels'
