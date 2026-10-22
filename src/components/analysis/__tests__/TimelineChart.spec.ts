import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineChart from '../TimelineChart.vue'
import type { TimelinePoint } from '@/lib/analysis'
import { LENSES } from '@/data/levels'

const points: TimelinePoint[] = [
  { bucket: '2026-10-22T08', label: '22 out, 08h', total: 2, byLevel: { left: 1, right: 1 } },
  { bucket: '2026-10-22T09', label: '22 out, 09h', total: 3, byLevel: { left: 3 } },
]

describe('TimelineChart', () => {
  it('renderiza uma barra por bucket', () => {
    const wrapper = mount(TimelineChart, { props: { points, lens: LENSES.ideology } })
    expect(wrapper.findAll('[data-test="bar"]')).toHaveLength(2)
  })

  it('desenha um retângulo por nível presente no bucket', () => {
    const wrapper = mount(TimelineChart, { props: { points, lens: LENSES.ideology } })
    expect(wrapper.findAll('rect')).toHaveLength(3)
  })

  it('expõe um resumo em texto para leitores de tela', () => {
    const wrapper = mount(TimelineChart, { props: { points, lens: LENSES.ideology } })
    expect(wrapper.find('svg').attributes('aria-label')).toContain('Evolução da cobertura')
  })

  it('não falha com lista vazia', () => {
    const wrapper = mount(TimelineChart, { props: { points: [], lens: LENSES.ideology } })
    expect(wrapper.findAll('[data-test="bar"]')).toHaveLength(0)
  })
})
