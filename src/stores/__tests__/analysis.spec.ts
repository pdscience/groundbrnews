import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAnalysisStore } from '../analysis'
import { SOURCES_BY_ID, STORIES } from '@/data'

describe('useAnalysisStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('começa na lente ideologia, sem filtros', () => {
    const store = useAnalysisStore()
    expect(store.lens).toBe('ideology')
    expect(store.theme).toBe('all')
    expect(store.minReliability).toBe('all')
    expect(store.query).toBe('')
  })

  it('retorna todas as histórias sem filtros', () => {
    expect(useAnalysisStore().filteredStories).toHaveLength(STORIES.length)
  })

  it('filtra por tema', () => {
    const store = useAnalysisStore()
    store.theme = STORIES[0]!.theme
    expect(store.filteredStories.every((s) => s.theme === STORIES[0]!.theme)).toBe(true)
    expect(store.filteredStories.length).toBeGreaterThan(0)
  })

  it('filtra por confiabilidade mínima mantendo só histórias com veículo acima do piso', () => {
    const store = useAnalysisStore()
    store.minReliability = 'high'
    const kept = store.filteredStories
    expect(kept.length).toBeGreaterThan(0)
    for (const story of kept) {
      const hasHigh = story.articles.some((a) => {
        const source = SOURCES_BY_ID.get(a.sourceId)
        return source?.reliability === 'high'
      })
      expect(hasHigh, story.slug).toBe(true)
    }
  })

  it('não descarta histórias quando o piso é o nível mais baixo', () => {
    const store = useAnalysisStore()
    store.minReliability = 'low'
    expect(store.filteredStories).toHaveLength(STORIES.length)
  })

  it('filtra por busca textual no título', () => {
    const store = useAnalysisStore()
    const term = STORIES[0]!.title.split(' ')[0]!.toLowerCase()
    store.query = term
    expect(store.filteredStories.length).toBeGreaterThan(0)
    expect(store.filteredStories.length).toBeLessThan(STORIES.length)
  })

  it('resetFilters restaura o estado inicial', () => {
    const store = useAnalysisStore()
    store.theme = 'x'
    store.query = 'y'
    store.minReliability = 'low'
    store.sortBy = 'asymmetry'
    store.resetFilters()
    expect(store.theme).toBe('all')
    expect(store.query).toBe('')
    expect(store.minReliability).toBe('all')
    expect(store.sortBy).toBe('recent')
  })

  it('trocar a lente não altera o conjunto filtrado', () => {
    const store = useAnalysisStore()
    const before = store.filteredStories.length
    store.setLens('region')
    expect(store.lens).toBe('region')
    expect(store.filteredStories.length).toBe(before)
  })

  it('ordena por número de veículos', () => {
    const store = useAnalysisStore()
    store.sortBy = 'sources'
    const counts = store.filteredStories.map((s) => s.articles.length)
    expect([...counts].sort((a, b) => b - a)).toEqual(counts)
  })

  it('ordena por data do artigo mais recente', () => {
    const store = useAnalysisStore()
    store.sortBy = 'recent'
    const latest = store.filteredStories.map((s) =>
      s.articles.reduce((acc, a) => Math.max(acc, Date.parse(a.publishedAt)), 0),
    )
    expect([...latest].sort((a, b) => b - a)).toEqual(latest)
  })
})
