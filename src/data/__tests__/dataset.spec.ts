import { describe, expect, it } from 'vitest'
import {
  CURATED_STORIES,
  DATASET_KIND,
  SOURCES,
  SOURCES_BY_ID,
  STORIES,
  STORIES_BY_SLUG,
  THEMES,
} from '../index'
import { IDEOLOGY_LEVELS, REGION_LEVELS, VEHICLE_TYPE_LEVELS } from '@/types/analysis'

describe('integridade dos veículos', () => {
  it('tem 40 veículos com ids únicos', () => {
    expect(SOURCES).toHaveLength(40)
    expect(SOURCES_BY_ID.size).toBe(40)
  })

  it('todo veículo usa níveis válidos nas três lentes', () => {
    for (const source of SOURCES) {
      expect(IDEOLOGY_LEVELS).toContain(source.ratings.ideology)
      expect(VEHICLE_TYPE_LEVELS).toContain(source.ratings.vehicleType)
      expect(REGION_LEVELS).toContain(source.ratings.region)
    }
  })
})

describe('dataset curado', () => {
  it('tem 18 histórias com slugs únicos', () => {
    expect(CURATED_STORIES).toHaveLength(18)
    expect(new Set(CURATED_STORIES.map((s) => s.slug)).size).toBe(18)
  })

  it('toda história tem ao menos 6 artigos, em ordem crescente', () => {
    for (const story of CURATED_STORIES) {
      expect(story.articles.length).toBeGreaterThanOrEqual(6)
      const times = story.articles.map((a) => Date.parse(a.publishedAt))
      expect(times.every((t) => Number.isFinite(t))).toBe(true)
      expect([...times].sort((a, b) => a - b)).toEqual(times)
    }
  })

  it('nenhuma história cita o mesmo veículo duas vezes', () => {
    for (const story of CURATED_STORIES) {
      const ids = story.articles.map((a) => a.sourceId)
      expect(new Set(ids).size, story.slug).toBe(ids.length)
    }
  })
})

describe('dataset ativo', () => {
  it('declara a origem dos dados', () => {
    expect(['real', 'demonstrativo']).toContain(DATASET_KIND)
  })

  it('tem slugs únicos', () => {
    expect(STORIES_BY_SLUG.size).toBe(STORIES.length)
  })

  it('toda história tem ao menos dois veículos distintos', () => {
    for (const story of STORIES) {
      expect(story.articles.length).toBeGreaterThanOrEqual(2)
      const ids = story.articles.map((a) => a.sourceId)
      expect(new Set(ids).size, story.slug).toBeGreaterThanOrEqual(2)
    }
  })

  it('todo artigo aponta para um veículo existente', () => {
    for (const story of STORIES) {
      for (const article of story.articles) {
        expect(SOURCES_BY_ID.has(article.sourceId), `${story.slug}/${article.id}`).toBe(true)
      }
    }
  })

  it('todo artigo tem data ISO válida e URL', () => {
    for (const story of STORIES) {
      for (const article of story.articles) {
        expect(Number.isFinite(Date.parse(article.publishedAt)), article.id).toBe(true)
        expect(article.url).toMatch(/^https?:\/\//)
        expect(article.title.length).toBeGreaterThan(10)
      }
    }
  })

  it('não há ids de artigo repetidos dentro de uma história', () => {
    for (const story of STORIES) {
      const ids = story.articles.map((a) => a.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('expõe temas sem duplicatas', () => {
    expect(THEMES).toEqual([...new Set(STORIES.map((s) => s.theme))].sort())
  })
})
