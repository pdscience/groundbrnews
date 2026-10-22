import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AnalysesView from '../AnalysesView.vue'
import { STORIES } from '@/data'

async function mountHub() {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/analises', component: AnalysesView },
      { path: '/analises/:slug', component: { template: '<div/>' } },
    ],
  })
  await router.push('/analises')
  await router.isReady()
  const wrapper = mount(AnalysesView, { global: { plugins: [router] } })
  return { wrapper }
}

describe('AnalysesView', () => {
  it('lista um card para cada história', async () => {
    const { wrapper } = await mountHub()
    expect(wrapper.findAll('.card')).toHaveLength(STORIES.length)
  })

  it('mostra o total de histórias analisadas', async () => {
    const { wrapper } = await mountHub()
    expect(wrapper.text()).toContain(`${STORIES.length} de ${STORIES.length} histórias`)
  })

  it('filtra ao digitar na busca', async () => {
    const { wrapper } = await mountHub()
    const input = wrapper.find('input[type="search"]')
    await input.setValue(STORIES[0]!.title.split(' ')[0]!)
    const shown = wrapper.findAll('.card').length
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThan(STORIES.length)
  })

  it('mostra estado vazio quando nada corresponde', async () => {
    const { wrapper } = await mountHub()
    await wrapper.find('input[type="search"]').setValue('zzzznaoexiste')
    expect(wrapper.find('[data-test="empty"]').exists()).toBe(true)
  })

  it('limpa os filtros pelo botão do estado vazio', async () => {
    const { wrapper } = await mountHub()
    await wrapper.find('input[type="search"]').setValue('zzzznaoexiste')
    await wrapper.find('.empty .reset').trigger('click')
    expect(wrapper.findAll('.card')).toHaveLength(STORIES.length)
  })
})
