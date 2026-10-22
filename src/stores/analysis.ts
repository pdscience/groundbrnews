import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { SOURCES, SOURCES_BY_ID, STORIES, THEMES } from '@/data'
import { asymmetry } from '@/lib/analysis'
import type { LensId, Reliability, Source, Story } from '@/types/analysis'

export type SortBy = 'recent' | 'asymmetry' | 'sources'

const RELIABILITY_RANK: Record<Reliability, number> = { low: 1, medium: 2, high: 3 }

export const useAnalysisStore = defineStore('analysis', () => {
  const lens = ref<LensId>('ideology')
  const theme = ref<string>('all')
  const sortBy = ref<SortBy>('recent')
  const minReliability = ref<Reliability | 'all'>('all')
  const query = ref<string>('')

  const themes = computed(() => THEMES)

  const filteredStories = computed<Story[]>(() => {
    const term = query.value.trim().toLowerCase()

    const filtered = STORIES.filter((story) => {
      if (theme.value !== 'all' && story.theme !== theme.value) return false

      if (minReliability.value !== 'all') {
        const min = RELIABILITY_RANK[minReliability.value]
        const ok = story.articles.some((a) => {
          const source: Source | undefined = SOURCES_BY_ID.get(a.sourceId)
          return source ? RELIABILITY_RANK[source.reliability] >= min : false
        })
        if (!ok) return false
      }

      if (term) {
        const haystack = [
          story.title,
          story.debate,
          ...story.summary,
          ...story.articles.map((a) => a.title),
          ...story.articles.map((a) => SOURCES_BY_ID.get(a.sourceId)?.name ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(term)) return false
      }

      return true
    })

    const latest = (s: Story): number =>
      s.articles.reduce((acc, a) => Math.max(acc, Date.parse(a.publishedAt)), 0)

    const sorted = [...filtered]
    if (sortBy.value === 'recent') sorted.sort((a, b) => latest(b) - latest(a))
    if (sortBy.value === 'sources') sorted.sort((a, b) => b.articles.length - a.articles.length)
    if (sortBy.value === 'asymmetry') {
      sorted.sort((a, b) => {
        const sa = asymmetry(a, SOURCES_BY_ID, lens.value)
        const sb = asymmetry(b, SOURCES_BY_ID, lens.value)
        return sb.dominantShare - sa.dominantShare
      })
    }
    return sorted
  })

  function setLens(id: LensId) {
    lens.value = id
  }

  function resetFilters() {
    theme.value = 'all'
    sortBy.value = 'recent'
    minReliability.value = 'all'
    query.value = ''
  }

  return {
    lens,
    theme,
    sortBy,
    minReliability,
    query,
    themes,
    filteredStories,
    setLens,
    resetFilters,
    sources: SOURCES,
  }
})
