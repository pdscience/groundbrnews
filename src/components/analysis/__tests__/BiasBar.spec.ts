import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BiasBar from '../BiasBar.vue'
import type { DistributionSlice } from '@/lib/analysis'
import type { Level } from '@/types/analysis'

const level = (id: string, label: string, color: string): Level => ({
  id: id as Level['id'],
  label,
  shortLabel: label,
  color,
  order: 0,
})

const slices: DistributionSlice[] = [
  { level: level('left', 'Esquerda', '#e53935'), count: 6, share: 0.6 },
  { level: level('center', 'Centro', '#ffffff'), count: 4, share: 0.4 },
]

describe('BiasBar', () => {
  it('renderiza um segmento por fatia com contagem maior que zero', () => {
    const wrapper = mount(BiasBar, { props: { slices } })
    expect(wrapper.findAll('[data-test="segment"]')).toHaveLength(2)
  })

  it('omite fatias zeradas', () => {
    const wrapper = mount(BiasBar, {
      props: {
        slices: [...slices, { level: level('right', 'Direita', '#1e88e5'), count: 0, share: 0 }],
      },
    })
    expect(wrapper.findAll('[data-test="segment"]')).toHaveLength(2)
  })

  it('define a largura do segmento pela proporção', () => {
    const wrapper = mount(BiasBar, { props: { slices } })
    const widths = wrapper.findAll('[data-test="segment"]').map((s) => s.attributes('style'))
    expect(widths[0]).toContain('60')
    expect(widths[1]).toContain('40')
  })

  it('expõe a distribuição em texto para leitores de tela', () => {
    const wrapper = mount(BiasBar, { props: { slices } })
    expect(wrapper.attributes('aria-label')).toContain('Esquerda')
    expect(wrapper.attributes('aria-label')).toContain('60%')
  })

  it('mostra os valores quando showValues é verdadeiro', () => {
    const wrapper = mount(BiasBar, { props: { slices, showValues: true } })
    expect(wrapper.text()).toContain('60%')
    expect(wrapper.text()).toContain('40%')
  })

  it('aplica degradê conectando as cores dos segmentos', () => {
    const wrapper = mount(BiasBar, { props: { slices } })
    const styles = wrapper.findAll('[data-test="segment"]').map((segment) => segment.attributes('style'))
    expect(styles[0]).toContain('linear-gradient')
    expect(styles[0]).toContain('rgb(')
  })

  it('usa texto escuro sobre o centro branco e claro sobre o vermelho', () => {
    const wrapper = mount(BiasBar, {
      props: {
        slices: [
          { level: level('left', 'Esquerda', '#e53935'), count: 5, share: 0.5 },
          { level: level('center', 'Centro', '#ffffff'), count: 5, share: 0.5 },
        ],
        showValues: true,
      },
    })
    const values = wrapper.findAll('.value').map((value) => (value.element as HTMLElement).style.color)
    expect(values[0]).toBe('rgb(255, 255, 255)')
    expect(values[1]).toBe('rgb(17, 24, 39)')
  })

  it('anuncia ausência de cobertura', () => {
    const wrapper = mount(BiasBar, { props: { slices: [] } })
    expect(wrapper.attributes('aria-label')).toContain('Nenhum veículo')
  })

  it('omite o rótulo numérico em fatias estreitas demais para caber', () => {
    const wrapper = mount(BiasBar, {
      props: {
        slices: [
          { level: level('left', 'Esquerda', '#e53935'), count: 1, share: 0.06 },
          { level: level('center', 'Centro', '#ffffff'), count: 15, share: 0.94 },
        ],
        showValues: true,
      },
    })
    expect(wrapper.text()).toContain('94%')
    expect(wrapper.text()).not.toContain('6%')
  })
})
