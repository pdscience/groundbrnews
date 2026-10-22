import { describe, expect, it } from 'vitest'
import { clusterItems, type ClusterItem } from '../cluster'
import { buildStoryText, splitSentences } from '../summarize'
import { buildStories } from '../build'
import { makeArticle, makeSources } from './helpers'

function item(
  id: string,
  sourceId: string,
  title: string,
  publishedAt = '2026-10-22T10:00:00Z',
): ClusterItem {
  return { id, sourceId, title, excerpt: title, publishedAt }
}

describe('clusterItems', () => {
  it('agrupa títulos equivalentes de veículos diferentes', () => {
    const result = clusterItems([
      item('a', 'folha', 'Palmeiras elimina Fluminense e vai à final da Libertadores'),
      item('b', 'g1', 'Palmeiras elimina o Fluminense e avança à final da Libertadores'),
      item('c', 'estadao', 'Receita abre consulta ao lote residual do Imposto de Renda'),
    ])

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]!.sort()).toEqual(['a', 'b'])
  })

  it('não agrupa dois artigos do mesmo veículo', () => {
    const result = clusterItems([
      item('a', 'folha', 'Palmeiras elimina Fluminense e vai à final da Libertadores'),
      item('b', 'folha', 'Palmeiras elimina o Fluminense e avança à final da Libertadores'),
    ])
    expect(result.groups).toHaveLength(0)
  })

  it('respeita a janela temporal', () => {
    const result = clusterItems([
      item('a', 'folha', 'Palmeiras elimina Fluminense e vai à final da Libertadores', '2026-10-20T10:00:00Z'),
      item('b', 'g1', 'Palmeiras elimina o Fluminense e avança à final da Libertadores', '2026-10-25T10:00:00Z'),
    ])
    expect(result.groups).toHaveLength(0)
  })

  it('ignora itens com data inválida', () => {
    const result = clusterItems([
      item('a', 'folha', 'Palmeiras elimina Fluminense e vai à final da Libertadores', 'sem-data'),
      item('b', 'g1', 'Palmeiras elimina o Fluminense e avança à final da Libertadores'),
    ])
    expect(result.groups).toHaveLength(0)
  })
})

describe('splitSentences', () => {
  it('separa frases e descarta as muito curtas', () => {
    const sentences = splitSentences('Primeira frase com tamanho razoável. Curta. Segunda frase também com tamanho suficiente para entrar.')
    expect(sentences).toHaveLength(2)
  })
})

describe('buildStoryText', () => {
  const members = [
    {
      title: 'Palmeiras vence Fluminense e vai à final',
      excerpt:
        'O Palmeiras venceu o Fluminense nos pênaltis e avançou à final da Libertadores. A decisão foi disputada no Allianz Parque.',
    },
    {
      title: 'Nos pênaltis, Palmeiras elimina o Fluminense',
      excerpt:
        'Com defesas decisivas, o Palmeiras garantiu vaga na final da Libertadores após empate no tempo normal.',
    },
  ]

  it('produz resumo não vazio e sem repetir o debate', () => {
    const result = buildStoryText(members)
    expect(result.summary.length).toBeGreaterThan(0)
    expect(result.debate.length).toBeGreaterThan(0)
    expect(result.summary).not.toContain(result.debate)
  })
})

describe('buildStories', () => {
  const sources = makeSources(['folha', 'g1', 'estadao'])

  it('exige dois veículos distintos e deduplica por veículo', () => {
    const articles = [
      makeArticle({ id: 'a1', sourceId: 'folha', title: 'Palmeiras vence Fluminense e vai à final da Libertadores' }),
      makeArticle({ id: 'a2', sourceId: 'folha', title: 'Palmeiras vence Fluminense e vai à final da Libertadores' }),
    ]
    const stories = buildStories(articles, [['a1', 'a2']], sources)
    expect(stories).toHaveLength(0)
  })

  it('marca o tom como estimado e ordena artigos por data', () => {
    const articles = [
      makeArticle({
        id: 'a1',
        sourceId: 'folha',
        title: 'Palmeiras vence Fluminense e vai à final da Libertadores',
        publishedAt: '2026-10-22T12:00:00Z',
      }),
      makeArticle({
        id: 'a2',
        sourceId: 'g1',
        title: 'Palmeiras vence o Fluminense e avança à final da Libertadores',
        publishedAt: '2026-10-22T10:00:00Z',
      }),
    ]

    const stories = buildStories(articles, [['a1', 'a2']], sources)
    expect(stories).toHaveLength(1)
    const story = stories[0]!
    expect(story.articles).toHaveLength(2)
    expect(story.articles[0]!.sourceId).toBe('g1')
    expect(story.articles.every((article) => article.stanceEstimated)).toBe(true)
    expect(story.slug.length).toBeGreaterThan(3)
    expect(story.summary.length).toBeGreaterThan(0)
  })

  it('gera slugs únicos quando o título canônico se repete', () => {
    const articles = [
      makeArticle({ id: 'a1', sourceId: 'folha', title: 'Mesmo título repetido em duas histórias diferentes' }),
      makeArticle({ id: 'a2', sourceId: 'g1', title: 'Mesmo título repetido em duas histórias diferentes' }),
      makeArticle({ id: 'b1', sourceId: 'estadao', title: 'Mesmo título repetido em duas histórias diferentes' }),
      makeArticle({ id: 'b2', sourceId: 'folha', title: 'Mesmo título repetido em duas histórias diferentes' }),
    ]

    const stories = buildStories(articles, [['a1', 'a2'], ['b1', 'b2']], sources)
    const slugs = stories.map((story) => story.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
