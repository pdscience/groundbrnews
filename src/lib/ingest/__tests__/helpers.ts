import type { Article, Source } from '@/types/analysis'

const DOMAINS: Record<string, string> = {
  folha: 'folha.uol.com.br',
  uol: 'uol.com.br',
  g1: 'g1.globo.com',
  globo: 'oglobo.globo.com',
  estadao: 'estadao.com.br',
  valor: 'valor.globo.com',
  metropoles: 'metropoles.com',
  cnnbrasil: 'cnnbrasil.com.br',
  poder360: 'poder360.com.br',
  atarde: 'atarde.com.br',
}

export function makeSources(ids: string[]): Source[] {
  return ids.map((id) => ({
    id,
    name: id,
    domain: DOMAINS[id] ?? `${id}.com.br`,
    monogram: id.slice(0, 2).toUpperCase(),
    brandColor: '#000',
    ratings: { ideology: 'center', vehicleType: 'portal', region: 'sudeste' },
    reliability: 'high',
    ownership: 'independent',
    reach: 'national',
    state: 'SP',
  }))
}

export function makeArticle(overrides: Partial<Article> & Pick<Article, 'id' | 'sourceId'>): Article {
  return {
    title: 'Título de teste com palavras suficientes',
    excerpt: 'Trecho de teste com conteúdo suficiente para análise.',
    url: `https://exemplo.com.br/${overrides.id}`,
    publishedAt: '2026-10-22T10:00:00Z',
    stance: 'neutral',
    ...overrides,
  }
}
