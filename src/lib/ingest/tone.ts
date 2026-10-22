import type { Stance } from '@/types/analysis'
import { fold } from './text'

const SUPPORT = [
  'sucesso', 'conquista', 'melhora', 'melhoria', 'elogio', 'elogia', 'solucao',
  'eficaz', 'fortalecimento', 'alivio', 'esperanca', 'exemplar', 'promissor',
  'celebrado', 'destaca-se', 'bem-sucedido',
]

const CRITICAL = [
  'crise', 'escandalo', 'fraude', 'corrupcao', 'negligencia', 'omissao', 'ilegal',
  'irregular', 'caos', 'colapso', 'alarmante', 'preocupante', 'sucateamento', 'desmonte',
  'retrocesso', 'abusivo', 'manipulacao', 'mentira', 'distorcao', 'desigualdade',
  'pobreza', 'fome', 'tragedia', 'desastre', 'calamidade', 'impunidade',
]

const MIXED_MARKERS = ['mas', 'porem', 'contudo', 'entretanto', 'no entanto', 'por outro lado', 'apesar']

const NEGATIONS = ['nao', 'nunca', 'jamais', 'nenhum', 'nenhuma', 'sem']

function countHits(text: string, terms: string[]): number {
  let hits = 0
  for (const term of terms) {
    let index = text.indexOf(term)
    while (index !== -1) {
      const before = text.slice(Math.max(0, index - 14), index)
      const negated = NEGATIONS.some((word) => new RegExp(`\\b${word}\\s*$`).test(before))
      hits += negated ? -1 : 1
      index = text.indexOf(term, index + term.length)
    }
  }
  return hits
}

export interface ToneResult {
  stance: Stance
  score: number
  support: number
  critical: number
}

export function estimateTone(title: string, excerpt = ''): ToneResult {
  const text = `${fold(title)} ${fold(excerpt)}`
  const support = countHits(text, SUPPORT)
  const critical = countHits(text, CRITICAL)
  const total = Math.abs(support) + Math.abs(critical)

  if (total === 0) return { stance: 'neutral', score: 0, support, critical }

  const score = (support - critical) / total
  const hasMixedMarker = MIXED_MARKERS.some((marker) => text.includes(marker))

  if (support > 0 && critical > 0 && (hasMixedMarker || Math.abs(score) < 0.4)) {
    return { stance: 'mixed', score, support, critical }
  }

  const decisive = total >= 2 ? Math.abs(score) >= 0.34 : Math.abs(score) === 1
  if (!decisive) return { stance: 'neutral', score, support, critical }
  if (score > 0) return { stance: 'support', score, support, critical }
  return { stance: 'critical', score, support, critical }
}
