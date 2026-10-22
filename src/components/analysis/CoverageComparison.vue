<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ArticleRow from './ArticleRow.vue'
import SourceAvatar from './SourceAvatar.vue'
import { compareSources } from '@/lib/analysis'
import { getLens } from '@/data/levels'
import type { LensId, Source, Story } from '@/types/analysis'

const props = defineProps<{ story: Story; sources: Map<string, Source>; lens: LensId }>()

const participants = computed(() => {
  const ids = [...new Set(props.story.articles.map((a) => a.sourceId))]
  return ids.map((id) => props.sources.get(id)).filter((s): s is Source => Boolean(s))
})

const idA = ref<string>('')
const idB = ref<string>('')

watch(
  participants,
  (list) => {
    if (idA.value === '' && list[0]) idA.value = list[0].id
    if (idB.value === '' && list[1]) idB.value = list[1].id
  },
  { immediate: true },
)

const sourceA = computed(() => props.sources.get(idA.value))
const sourceB = computed(() => props.sources.get(idB.value))

const comparison = computed(() =>
  idA.value && idB.value
    ? compareSources(props.story, props.sources, props.lens, idA.value, idB.value)
    : { a: [], b: [] },
)

const levelLabel = computed(() => {
  const lens = getLens(props.lens)
  const label = (source?: Source) => {
    if (!source) return '—'
    const level = lens.levels.find((l) => l.id === source.ratings[props.lens])
    return level?.label ?? '—'
  }
  return { a: label(sourceA.value), b: label(sourceB.value) }
})
</script>

<template>
  <div class="comparison">
    <div class="pickers">
      <label class="picker">
        <span class="picker-label">Veículo A</span>
        <select v-model="idA" data-test="select-a">
          <option v-for="p in participants" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </label>

      <label class="picker">
        <span class="picker-label">Veículo B</span>
        <select v-model="idB" data-test="select-b">
          <option v-for="p in participants" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </label>
    </div>

    <div class="grid">
      <div class="column">
        <header class="column-head">
          <SourceAvatar v-if="sourceA" :source="sourceA" :size="30" />
          <div>
            <strong>{{ sourceA?.name ?? 'Escolha um veículo' }}</strong>
            <span class="level">{{ levelLabel.a }}</span>
          </div>
        </header>
        <ul class="articles">
          <ArticleRow
            v-for="article in comparison.a"
            :key="article.id"
            :article="article"
            :source="sourceA"
          />
        </ul>
        <p v-if="comparison.a.length === 0" class="empty">Sem publicações para este veículo.</p>
      </div>

      <div class="column">
        <header class="column-head">
          <SourceAvatar v-if="sourceB" :source="sourceB" :size="30" />
          <div>
            <strong>{{ sourceB?.name ?? 'Escolha um veículo' }}</strong>
            <span class="level">{{ levelLabel.b }}</span>
          </div>
        </header>
        <ul class="articles">
          <ArticleRow
            v-for="article in comparison.b"
            :key="article.id"
            :article="article"
            :source="sourceB"
          />
        </ul>
        <p v-if="comparison.b.length === 0" class="empty">Sem publicações para este veículo.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparison {
  display: flex;
  flex-direction: column;
  gap: var(--cb-space-4);
}

.pickers {
  display: flex;
  gap: var(--cb-space-4);
  flex-wrap: wrap;
}

.picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--cb-ink-3);
}

.picker-label {
  font-weight: 600;
}

select {
  border: 1px solid var(--cb-border-strong);
  border-radius: var(--cb-radius-sm);
  padding: 7px 10px;
  font-size: 13px;
  background: var(--cb-surface);
  color: var(--cb-ink);
  min-width: 200px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--cb-space-5);
}

.column {
  border: 1px solid var(--cb-border);
  border-radius: var(--cb-radius);
  padding: var(--cb-space-4);
  background: var(--cb-surface-2);
}

.column-head {
  display: flex;
  align-items: center;
  gap: var(--cb-space-3);
  font-size: 13px;
  margin-bottom: var(--cb-space-2);
}

.column-head strong {
  display: block;
}

.level {
  color: var(--cb-ink-3);
  font-size: 12px;
}

.articles {
  margin: 0;
  padding: 0;
}

.empty {
  font-size: 12px;
  color: var(--cb-ink-3);
  margin: var(--cb-space-3) 0 0;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
