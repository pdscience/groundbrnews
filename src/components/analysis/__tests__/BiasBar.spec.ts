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
  { level: level('left', 'Esquerda', '#4c6fe7'), count: 6, share: 0.6 },
  { level: level('center', 'Centro', '#a6adb8'), count: 4, share: 0.4 },
]

describe('BiasBar', () => {
  it('renderiza um segmento por fatia com contagem maior que zero', () => {
    const wrapper = mount(BiasBar, { props: { slices } })
    expect(wrapper.findAll('[data-test="segment"]')).toHaveLength(2)
  })

  it('omite fatias zeradas', () => {
    const wrapper = mount(BiasBar, {
      props: {
        slices: [...slices, { level: level('right', 'Direita', '#d9483c'), count: 0, share: 0 }],
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

  it('anuncia ausência de cobertura', () => {
    const wrapper = mount(BiasBar, { props: { slices: [] } })
    expect(wrapper.attributes('aria-label')).toContain('Nenhum veículo')
  })

  it('omite o rótulo numérico em fatias estreitas demais para caber', () => {
    const wrapper = mount(BiasBar, {
      props: {
        slices: [
          { level: level('left', 'Esquerda', '#4c6fe7'), count: 1, share: 0.06 },
          { level: level('center', 'Centro', '#a6adb8'), count: 15, share: 0.94 },
        ],
        showValues: true,
      },
    })
    expect(wrapper.text()).toContain('94%')
    expect(wrapper.text()).not.toContain('6%')
  })
})
