import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import { storyGuard } from '@/router'
import AnalysesView from '@/views/AnalysesView.vue'
import StoryAnalysisView from '@/views/StoryAnalysisView.vue'
import MethodologyView from '@/views/MethodologyView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { STORIES } from '@/data'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: AnalysesView },
      { path: '/analises', name: 'analyses', component: AnalysesView },
      { path: '/analises/:slug', name: 'story', component: StoryAnalysisView, beforeEnter: storyGuard },
      { path: '/metodologia', name: 'methodology', component: MethodologyView },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
    ],
  })
}

async function visit(path: string) {
  const router = makeRouter()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router, createPinia()] } })
  return { wrapper, router }
}

describe('aplicação', () => {
  it('monta o cabeçalho e o rodapé', async () => {
    const { wrapper } = await visit('/analises')
    expect(wrapper.text()).toContain('Chão Brasil')
    expect(wrapper.text()).toMatch(/Dados reais coletados em|Dataset demonstrativo/)
  })

  it('mostra o hub na raiz', async () => {
    const { wrapper } = await visit('/')
    expect(wrapper.text()).toContain('Análises de cobertura no Brasil')
  })

  it('mostra o hub em /analises', async () => {
    const { wrapper } = await visit('/analises')
    expect(wrapper.text()).toContain('Análises de cobertura no Brasil')
  })

  it('mostra o detalhe de uma história', async () => {
    const { wrapper } = await visit(`/analises/${STORIES[0]!.slug}`)
    expect(wrapper.text()).toContain(STORIES[0]!.title)
  })

  it('mostra a metodologia', async () => {
    const { wrapper } = await visit('/metodologia')
    expect(wrapper.text()).toContain('As três lentes')
    expect(wrapper.text()).toContain('Selo de assimetria de cobertura')
  })

  it('mostra a página 404 para rota desconhecida', async () => {
    const { wrapper } = await visit('/rota/que-nao-existe')
    expect(wrapper.text()).toContain('Não encontramos esta análise')
  })

  it('leva para o hub quando o slug da história é inválido', async () => {
    const { router } = await visit('/analises/slug-invalido')
    expect(router.currentRoute.value.path).toBe('/analises')
  })
})
