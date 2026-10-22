import { describe, expect, it } from 'vitest'
import type { Source, Story } from '@/types/analysis'
import {
  asymmetry,
  compareSources,
  coverageTimeline,
  distribution,
  dominantSlice,
  firstReported,
  groupArticlesByLevel,
} from '../analysis'

function source(
  id: string,
  ideology: Source['ratings']['ideology'],
  region: Source['ratings']['region'] = 'sudeste',
): Source {
  return {
    id,
    name: id,
    domain: `${id}.com.br`,
    monogram: id[0]?.toUpperCase() ?? '?',
    brandColor: '#000',
    ratings: { ideology, vehicleType: 'portal', region },
    reliability: 'high',
    ownership: 'independent',
    reach: 'national',
    state: 'SP',
  }
}

function story(sources: Source[]): Story {
  return {
    id: 's1',
    slug: 's1',
    title: 't',
    summary: [],
    debate: 'd',
    theme: 'x',
    region: 'sudeste',
    state: 'SP',
    articles: sources.map((s, i) => ({
      id: `a${i}`,
      sourceId: s.id,
      title: 't',
      excerpt: 'e',
      url: 'https://x.com',
      publishedAt: '2026-10-22T10:00:00Z',
      stance: 'neutral' as const,
    })),
  }
}

function mapOf(sources: Source[]): Map<string, Source> {
  return new Map(sources.map((s) => [s.id, s]))
}

describe('distribution', () => {
  it('devolve uma fatia por nível da lente, na ordem da lente', () => {
    const sources = mapOf([source('a', 'left'), source('b', 'left'), source('c', 'right')])
    const slices = distribution(story([...sources.values()]), sources, 'ideology')
    expect(slices.map((s) => s.level.id)).toEqual([
      'left',
      'center-left',
      'center',
      'center-right',
      'right',
    ])
  })

  it('calcula contagem e proporção', () => {
    const sources = mapOf([source('a', 'left'), source('b', 'left'), source('c', 'right')])
    const slices = distribution(story([...sources.values()]), sources, 'ideology')
    expect(slices[0]).toMatchObject({ count: 2, share: 2 / 3 })
    expect(slices[4]).toMatchObject({ count: 1, share: 1 / 3 })
  })

  it('ignora artigos cujo veículo não existe no mapa', () => {
    const sources = mapOf([source('a', 'left')])
    const s = story([...sources.values()])
    s.articles.push({
      id: 'x',
      sourceId: 'fantasma',
      title: 't',
      excerpt: 'e',
      url: 'https://x.com',
      publishedAt: '2026-10-22T10:00:00Z',
      stance: 'neutral',
    })
    const slices = distribution(s, sources, 'ideology')
    expect(slices.reduce((acc, sl) => acc + sl.count, 0)).toBe(1)
  })

  it('devolve todas as fatias zeradas quando não há artigos', () => {
    const slices = distribution(story([]), new Map<string, Source>(), 'ideology')
    expect(slices.every((s) => s.count === 0 && s.share === 0)).toBe(true)
  })

  it('lê o rating da lente pedida', () => {
    const s = source('a', 'left')
    s.ratings.vehicleType = 'radio'
    const sources = mapOf([s])
    const slices = distribution(story([s]), sources, 'vehicleType')
    expect(slices.find((sl) => sl.level.id === 'radio')?.count).toBe(1)
  })
})

describe('dominantSlice', () => {
  it('devolve a fatia com maior contagem', () => {
    const sources = mapOf([source('a', 'left'), source('b', 'left'), source('c', 'right')])
    const slices = distribution(story([...sources.values()]), sources, 'ideology')
    expect(dominantSlice(slices)?.level.id).toBe('left')
  })

  it('devolve null para lista vazia', () => {
    expect(dominantSlice([])).toBeNull()
  })
})

describe('asymmetry — lente ideologia', () => {
  it('não sinaliza cobertura equilibrada', () => {
    const sources = mapOf([
      source('a', 'left'),
      source('b', 'center-left'),
      source('c', 'center'),
      source('d', 'center-right'),
      source('e', 'right'),
    ])
    expect(asymmetry(story([...sources.values()]), sources, 'ideology').flagged).toBe(false)
  })

  it('sinaliza assimetria à esquerda com severidade alta', () => {
    const sources = mapOf([
      source('a', 'left'),
      source('b', 'left'),
      source('c', 'left'),
      source('d', 'left'),
      source('e', 'left'),
      source('f', 'left'),
      source('g', 'right'),
    ])
    const result = asymmetry(story([...sources.values()]), sources, 'ideology')
    expect(result.flagged).toBe(true)
    expect(result.severity).toBe('high')
    expect(result.dominantLevel.id).toBe('left')
    expect(result.oppositeShare).toBeCloseTo(1 / 7)
  })

  it('exige pelo menos 5 veículos', () => {
    const sources = mapOf([
      source('a', 'left'),
      source('b', 'left'),
      source('c', 'left'),
      source('d', 'right'),
    ])
    expect(asymmetry(story([...sources.values()]), sources, 'ideology').flagged).toBe(false)
  })

  it('não sinaliza quando o lado oposto tem mais de 25%', () => {
    const sources = mapOf([
      source('a', 'left'),
      source('b', 'left'),
      source('c', 'left'),
      source('d', 'left'),
      source('e', 'right'),
      source('f', 'right'),
    ])
    expect(asymmetry(story([...sources.values()]), sources, 'ideology').flagged).toBe(false)
  })

  it('trata cobertura só central como não sinalizada', () => {
    const sources = mapOf([
      source('a', 'center'),
      source('b', 'center'),
      source('c', 'center'),
      source('d', 'center'),
      source('e', 'center'),
    ])
    const result = asymmetry(story([...sources.values()]), sources, 'ideology')
    expect(result.flagged).toBe(false)
    expect(result.severity).toBe('none')
  })
})

describe('asymmetry — lente de concentração', () => {
  it('sinaliza concentração acima de 60% com segunda fatia abaixo de 20%', () => {
    const sources = mapOf([
      source('a', 'center', 'sudeste'),
      source('b', 'center', 'sudeste'),
      source('c', 'center', 'sudeste'),
      source('d', 'center', 'sudeste'),
      source('e', 'left', 'sul'),
      source('f', 'left', 'nordeste'),
    ])
    const result = asymmetry(story([...sources.values()]), sources, 'region')
    expect(result.flagged).toBe(true)
    expect(result.severity).toBe('moderate')
    expect(result.dominantLevel.id).toBe('sudeste')
  })

  it('devolve flagged false e severidade none quando não há assimetria', () => {
    const sources = mapOf([
      source('a', 'center', 'sudeste'),
      source('b', 'center', 'sudeste'),
      source('c', 'left', 'sul'),
      source('d', 'right', 'norte'),
    ])
    const result = asymmetry(story([...sources.values()]), sources, 'region')
    expect(result.flagged).toBe(false)
    expect(result.severity).toBe('none')
  })
})

describe('coverageTimeline', () => {
  it('agrupa por hora quando a história dura menos de 36 horas', () => {
    const sources = mapOf([source('a', 'left'), source('b', 'right')])
    const s = story([...sources.values()])
    s.articles[0]!.publishedAt = '2026-10-22T08:00:00Z'
    s.articles[1]!.publishedAt = '2026-10-22T12:00:00Z'
    const { granularity, points } = coverageTimeline(s, sources, 'ideology')
    expect(granularity).toBe('hour')
    expect(points.map((p) => p.bucket)).toEqual([
      '2026-10-22T08',
      '2026-10-22T09',
      '2026-10-22T10',
      '2026-10-22T11',
      '2026-10-22T12',
    ])
    expect(points[0]!.total).toBe(1)
    expect(points[4]!.total).toBe(1)
    expect(points[1]!.total).toBe(0)
  })

  it('preenche buckets sem cobertura com total zero', () => {
    const sources = mapOf([source('a', 'left')])
    const s = story([...sources.values()])
    s.articles[0]!.publishedAt = '2026-10-22T08:00:00Z'
    const { points } = coverageTimeline(s, sources, 'ideology')
    expect(points.reduce((a, p) => a + p.total, 0)).toBe(1)
  })

  it('agrupa por dia quando a história dura mais de 36 horas', () => {
    const sources = mapOf([source('a', 'left'), source('b', 'right')])
    const s = story([...sources.values()])
    s.articles[0]!.publishedAt = '2026-10-20T08:00:00Z'
    s.articles[1]!.publishedAt = '2026-10-22T08:00:00Z'
    const { granularity } = coverageTimeline(s, sources, 'ideology')
    expect(granularity).toBe('day')
  })

  it('devolve lista vazia quando não há artigos', () => {
    const { points } = coverageTimeline(story([]), new Map<string, Source>(), 'ideology')
    expect(points).toHaveLength(0)
  })
})

describe('firstReported', () => {
  it('devolve o artigo mais antigo', () => {
    const s = story([source('a', 'left')])
    s.articles[0]!.publishedAt = '2026-10-22T15:00:00Z'
    s.articles.push({
      id: 'z',
      sourceId: 'a',
      title: 't',
      excerpt: 'e',
      url: 'https://x.com',
      publishedAt: '2026-10-22T09:00:00Z',
      stance: 'neutral',
    })
    expect(firstReported(s)?.id).toBe('z')
  })

  it('devolve null para história sem artigos', () => {
    expect(firstReported(story([]))).toBeNull()
  })
})

describe('groupArticlesByLevel', () => {
  it('separa artigos por nível da lente', () => {
    const sources = mapOf([source('a', 'left'), source('b', 'right')])
    const grouped = groupArticlesByLevel(story([...sources.values()]), sources, 'ideology')
    expect(grouped.get('left')).toHaveLength(1)
    expect(grouped.get('right')).toHaveLength(1)
  })
})

describe('compareSources', () => {
  it('separa os artigos dos dois veículos comparados', () => {
    const sources = mapOf([source('a', 'left'), source('b', 'right'), source('c', 'center')])
    const result = compareSources(story([...sources.values()]), sources, 'ideology', 'a', 'c')
    expect(result.a).toHaveLength(1)
    expect(result.b).toHaveLength(1)
  })
})
