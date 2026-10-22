import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import StoryCard from '../StoryCard.vue'
import { SOURCES_BY_ID, STORIES } from '@/data'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/analises/:slug', component: { template: '<div/>' } }],
})

function mountCard(lens: 'ideology' | 'vehicleType' | 'region' = 'ideology') {
  return mount(StoryCard, {
    props: { story: STORIES[0]!, sources: SOURCES_BY_ID, lens },
    global: { plugins: [router] },
  })
}

describe('StoryCard', () => {
  it('mostra o título da história', () => {
    expect(mountCard().text()).toContain(STORIES[0]!.title)
  })

  it('mostra o número de veículos que publicaram', () => {
    expect(mountCard().text()).toMatch(/\d+ veículos?/)
  })

  it('linka para a página de análise da história', () => {
    expect(mountCard().find('a').attributes('href')).toBe(`/analises/${STORIES[0]!.slug}`)
  })

  it('mostra o veículo que noticiou primeiro', () => {
    expect(mountCard().text()).toContain('Primeiro a publicar')
  })

  it('renderiza a barra de distribuição', () => {
    expect(mountCard().find('[data-test="bar"]').exists()).toBe(true)
  })

  it('muda a barra ao trocar de lente', () => {
    const ideology = mountCard('ideology')
    const region = mountCard('region')
    const ideologyWidths = ideology.findAll('[data-test="segment"]').map((s) => s.attributes('style'))
    const regionWidths = region.findAll('[data-test="segment"]').map((s) => s.attributes('style'))
    expect(regionWidths).not.toEqual(ideologyWidths)
  })
})
