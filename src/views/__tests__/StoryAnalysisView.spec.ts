import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import StoryAnalysisView from '../StoryAnalysisView.vue'
import { storyGuard } from '@/router'
import { STORIES } from '@/data'

async function mountAt(slug: string) {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/analises', name: 'analyses', component: { template: '<div/>' } },
      {
        path: '/analises/:slug',
        name: 'story',
        component: StoryAnalysisView,
        beforeEnter: storyGuard,
      },
      { path: '/', name: 'home', component: { template: '<div/>' } },
    ],
  })
  await router.push(`/analises/${slug}`)
  await router.isReady()
  const wrapper = mount(StoryAnalysisView, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('StoryAnalysisView', () => {
  it('mostra o título da história do slug da rota', async () => {
    const { wrapper } = await mountAt(STORIES[0]!.slug)
    expect(wrapper.text()).toContain(STORIES[0]!.title)
  })

  it('mostra o resumo e o debate', async () => {
    const { wrapper } = await mountAt(STORIES[0]!.slug)
    expect(wrapper.text()).toContain(STORIES[0]!.debate)
    for (const item of STORIES[0]!.summary) expect(wrapper.text()).toContain(item)
  })

  it('mostra a seção de veículos que publicaram', async () => {
    const { wrapper } = await mountAt(STORIES[0]!.slug)
    expect(wrapper.text()).toContain('Veículos que publicaram')
  })

  it('mostra a seção de comparação entre veículos', async () => {
    const { wrapper } = await mountAt(STORIES[0]!.slug)
    expect(wrapper.text()).toContain('Comparar veículos')
  })

  it('redireciona para o hub quando o slug não existe', async () => {
    const { router } = await mountAt('slug-que-nao-existe')
    expect(router.currentRoute.value.path).toBe('/analises')
  })

  it('mostra o estado "não encontrada" se a view for montada sem história', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/analises', name: 'analyses', component: { template: '<div/>' } },
        { path: '/analises/:slug', name: 'story', component: StoryAnalysisView },
      ],
    })
    await router.push('/analises')
    await router.isReady()
    const wrapper = mount(StoryAnalysisView, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('Análise não encontrada')
  })
})
