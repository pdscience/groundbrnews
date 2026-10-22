import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LevelLegend from '../LevelLegend.vue'
import { getLens } from '@/data/levels'
import type { DistributionSlice } from '@/lib/analysis'

const lens = getLens('ideology')

const slices: DistributionSlice[] = lens.levels.map((level, index) => ({
  level,
  count: index,
  share: index * 0.1,
}))

describe('LevelLegend', () => {
  it('mostra todos os níveis da lente', () => {
    const wrapper = mount(LevelLegend, { props: { lens } })
    const labels = wrapper.findAll('.label').map((item) => item.text())
    expect(labels).toEqual(lens.levels.map((level) => level.label))
  })

  it('mostra a porcentagem de cada nível, inclusive zero', () => {
    const wrapper = mount(LevelLegend, { props: { lens, slices } })
    const shares = wrapper.findAll('.share').map((item) => item.text())
    expect(shares).toEqual(['0%', '10%', '20%', '30%', '40%'])
  })

  it('não mostra porcentagens sem slices', () => {
    const wrapper = mount(LevelLegend, { props: { lens } })
    expect(wrapper.findAll('.share')).toHaveLength(0)
  })

  it('pinta o marcador com a cor do nível', () => {
    const wrapper = mount(LevelLegend, { props: { lens, slices } })
    const dots = wrapper.findAll('.dot').map((dot) => (dot.element as HTMLElement).style.background)
    expect(dots[0]).toBe('rgb(229, 57, 53)')
    expect(dots[2]).toBe('rgb(130, 97, 141)')
  })
})
