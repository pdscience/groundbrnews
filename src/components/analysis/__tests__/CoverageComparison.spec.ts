import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CoverageComparison from '../CoverageComparison.vue'
import { SOURCES_BY_ID, STORIES } from '@/data'

const story = STORIES[0]!
const participants = [...new Set(story.articles.map((a) => a.sourceId))]

describe('CoverageComparison', () => {
  it('lista os veículos participantes como opções', () => {
    const wrapper = mount(CoverageComparison, {
      props: { story, sources: SOURCES_BY_ID, lens: 'ideology' },
    })
    const options = wrapper.findAll('[data-test="select-a"] option')
    expect(options.length).toBe(participants.length)
  })

  it('seleciona dois veículos por padrão e mostra as duas colunas', () => {
    const wrapper = mount(CoverageComparison, {
      props: { story, sources: SOURCES_BY_ID, lens: 'ideology' },
    })
    const selectA = wrapper.find('[data-test="select-a"]').element as HTMLSelectElement
    const selectB = wrapper.find('[data-test="select-b"]').element as HTMLSelectElement
    expect(selectA.value).toBe(participants[0])
    expect(selectB.value).toBe(participants[1])
  })

  it('mostra os artigos do veículo escolhido', async () => {
    const wrapper = mount(CoverageComparison, {
      props: { story, sources: SOURCES_BY_ID, lens: 'ideology' },
    })
    const target = participants[2]!
    await wrapper.find('[data-test="select-a"]').setValue(target)
    const expected = story.articles.find((a) => a.sourceId === target)!
    expect(wrapper.text()).toContain(expected.title)
  })

  it('mostra o nível do veículo na lente ativa', () => {
    const wrapper = mount(CoverageComparison, {
      props: { story, sources: SOURCES_BY_ID, lens: 'ideology' },
    })
    const source = SOURCES_BY_ID.get(participants[0]!)!
    expect(wrapper.text()).toContain(source.name)
  })
})
