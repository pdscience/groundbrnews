import { describe, expect, it } from 'vitest'
import { formatBucketLabel, formatPercent, formatDateTime, formatRelativeTime } from '../format'

describe('formatPercent', () => {
  it('arredonda para o inteiro mais próximo', () => {
    expect(formatPercent(0.463)).toBe('46%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(1)).toBe('100%')
  })
})

describe('formatDateTime', () => {
  it('formata no padrão pt-BR', () => {
    expect(formatDateTime('2026-10-22T14:30:00Z')).toContain('out')
  })
})

describe('formatRelativeTime', () => {
  it('mede a distância em horas', () => {
    const now = new Date('2026-10-22T18:00:00Z')
    expect(formatRelativeTime('2026-10-22T15:00:00Z', now)).toBe('há 3 h')
  })

  it('devolve "agora" para o mesmo instante', () => {
    const now = new Date('2026-10-22T18:00:00Z')
    expect(formatRelativeTime('2026-10-22T18:00:00Z', now)).toBe('agora')
  })

  it('converte para dias depois de 24 horas', () => {
    const now = new Date('2026-10-25T18:00:00Z')
    expect(formatRelativeTime('2026-10-22T18:00:00Z', now)).toBe('há 3 d')
  })
})

describe('formatBucketLabel', () => {
  it('formata bucket por dia', () => {
    expect(formatBucketLabel('2026-10-22', 'day')).toBe('22 out')
  })

  it('formata bucket por hora', () => {
    expect(formatBucketLabel('2026-10-22T14', 'hour')).toBe('22 out, 14h')
  })
})
