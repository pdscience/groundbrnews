import { describe, expect, it } from 'vitest'
import type { Article, Story } from '@/types/analysis'
import { mergeStories } from '../merge'
import { makeArticle, makeSources } from './helpers'

const SOURCES = makeSources(['folha', 'g1', 'estadao', 'valor', 'cnnbrasil'])
const NOW = '2026-10-22T12:00:00Z'

function story(id: string, slug: string, articles: Article[], updatedAt = NOW): Story {
  return {
    id,
    slug,
    title: `História ${id}`,
    summary: ['Resumo'],
    debate: 'Em disputa: algo.',
    theme: 'Política',
    region: 'sudeste',
    state: 'SP',
    articles,
    updatedAt,
  }
}

function daysAgo(days: number): string {
  return new Date(Date.parse(NOW) - days * 86_400_000).toISOString()
}

describe('mergeStories', () => {
  it('une artigos de uma história que compartilha URL e preserva slug e id', () => {
    const shared = makeArticle({
      id: 'a1',
      sourceId: 'folha',
      url: 'https://folha.uol.com.br/a1',
      publishedAt: daysAgo(1),
    })
    const previous = [
      story('st-old', 'titulo-antigo', [
        shared,
        makeArticle({ id: 'b1', sourceId: 'g1', url: 'https://g1.globo.com/b1', publishedAt: daysAgo(1) }),
      ]),
    ]
    const fresh = [
      story('st-new', 'titulo-novo', [
        shared,
        makeArticle({ id: 'c1', sourceId: 'estadao', url: 'https://estadao.com.br/c1', publishedAt: daysAgo(0) }),
      ]),
    ]

    const result = mergeStories(fresh, previous, SOURCES, { now: NOW })

    expect(result.stories).toHaveLength(1)
    expect(result.mergedStories).toBe(1)
    expect(result.retainedStories).toBe(0)
    const merged = result.stories[0]!
    expect(merged.id).toBe('st-old')
    expect(merged.slug).toBe('titulo-antigo')
    expect(merged.articles.map((article) => article.sourceId).sort()).toEqual(['estadao', 'folha', 'g1'])
  })

  it('mantém histórias antigas sem sobreposição enquanto dentro da retenção', () => {
    const previous = [
      story('st-old', 'antiga', [
        makeArticle({ id: 'a1', sourceId: 'folha', url: 'https://folha.uol.com.br/a1', publishedAt: daysAgo(3) }),
        makeArticle({ id: 'b1', sourceId: 'g1', url: 'https://g1.globo.com/b1', publishedAt: daysAgo(3) }),
      ], daysAgo(3)),
    ]
    const fresh = [
      story('st-new', 'nova', [
        makeArticle({ id: 'c1', sourceId: 'estadao', url: 'https://estadao.com.br/c1', publishedAt: daysAgo(0) }),
        makeArticle({ id: 'd1', sourceId: 'valor', url: 'https://valor.globo.com/d1', publishedAt: daysAgo(0) }),
      ]),
    ]

    const result = mergeStories(fresh, previous, SOURCES, { now: NOW })

    expect(result.stories).toHaveLength(2)
    expect(result.mergedStories).toBe(0)
    expect(result.retainedStories).toBe(1)
    expect(result.stories.map((item) => item.slug).sort()).toEqual(['antiga', 'nova'])
    expect(result.stories.find((item) => item.id === 'st-old')?.updatedAt).toBe(daysAgo(3))
  })

  it('descarta histórias cujo artigo mais recente passou da retenção', () => {
    const previous = [
      story('st-old', 'antiga', [
        makeArticle({ id: 'a1', sourceId: 'folha', url: 'https://folha.uol.com.br/a1', publishedAt: daysAgo(9) }),
        makeArticle({ id: 'b1', sourceId: 'g1', url: 'https://g1.globo.com/b1', publishedAt: daysAgo(8) }),
      ]),
    ]

    const result = mergeStories([], previous, SOURCES, { now: NOW, retentionDays: 7 })

    expect(result.stories).toHaveLength(0)
    expect(result.expiredStories).toBe(1)
  })

  it('mantém um único artigo por veículo, priorizando o mais antigo', () => {
    const previous = [
      story('st-old', 'antiga', [
        makeArticle({ id: 'f1', sourceId: 'folha', url: 'https://folha.uol.com.br/f1', publishedAt: daysAgo(2) }),
        makeArticle({ id: 'b1', sourceId: 'g1', url: 'https://g1.globo.com/b1', publishedAt: daysAgo(2) }),
      ]),
    ]
    const fresh = [
      story('st-new', 'nova', [
        makeArticle({ id: 'f2', sourceId: 'folha', url: 'https://folha.uol.com.br/f2', publishedAt: daysAgo(0) }),
        makeArticle({ id: 'b1', sourceId: 'g1', url: 'https://g1.globo.com/b1', publishedAt: daysAgo(2) }),
      ]),
    ]

    const result = mergeStories(fresh, previous, SOURCES, { now: NOW })
    const merged = result.stories[0]!

    expect(merged.articles.map((article) => article.url).sort()).toEqual([
      'https://folha.uol.com.br/f1',
      'https://g1.globo.com/b1',
    ])
  })

  it('respeita o limite de artigos por história ao absorver cobertura antiga', () => {
    const previous = [
      story('st-old', 'antiga', [
        makeArticle({ id: 'f1', sourceId: 'folha', url: 'https://folha.uol.com.br/f1', publishedAt: daysAgo(3) }),
        makeArticle({ id: 'b1', sourceId: 'g1', url: 'https://g1.globo.com/b1', publishedAt: daysAgo(3) }),
      ]),
    ]
    const fresh = [
      story('st-new', 'nova', [
        makeArticle({ id: 'f1', sourceId: 'folha', url: 'https://folha.uol.com.br/f1', publishedAt: daysAgo(3) }),
        makeArticle({ id: 'e1', sourceId: 'estadao', url: 'https://estadao.com.br/e1', publishedAt: daysAgo(1) }),
        makeArticle({ id: 'v1', sourceId: 'valor', url: 'https://valor.globo.com/v1', publishedAt: daysAgo(1) }),
      ]),
    ]

    const result = mergeStories(fresh, previous, SOURCES, {
      now: NOW,
      maxArticlesPerStory: 2,
    })

    expect(result.stories[0]!.articles).toHaveLength(2)
    expect(result.stories[0]!.articles.map((article) => article.sourceId).sort()).toEqual([
      'folha',
      'g1',
    ])
  })

  it('limita o total de histórias e ordena por cobertura', () => {
    const previous = [
      story('st-a', 'a', [
        makeArticle({ id: 'a1', sourceId: 'folha', url: 'https://folha.uol.com.br/a1', publishedAt: daysAgo(1) }),
        makeArticle({ id: 'a2', sourceId: 'g1', url: 'https://g1.globo.com/a2', publishedAt: daysAgo(1) }),
      ]),
      story('st-b', 'b', [
        makeArticle({ id: 'b1', sourceId: 'estadao', url: 'https://estadao.com.br/b1', publishedAt: daysAgo(1) }),
        makeArticle({ id: 'b2', sourceId: 'valor', url: 'https://valor.globo.com/b2', publishedAt: daysAgo(1) }),
        makeArticle({ id: 'b3', sourceId: 'cnnbrasil', url: 'https://cnnbrasil.com.br/b3', publishedAt: daysAgo(1) }),
      ]),
    ]

    const result = mergeStories([], previous, SOURCES, { now: NOW, maxStories: 1 })

    expect(result.stories).toHaveLength(1)
    expect(result.stories[0]!.id).toBe('st-b')
  })
})
