<script setup lang="ts">
import { computed } from 'vue'
import LensSwitcher from '@/components/analysis/LensSwitcher.vue'
import AnalysisFilters from '@/components/analysis/AnalysisFilters.vue'
import StoryCard from '@/components/analysis/StoryCard.vue'
import { SOURCES_BY_ID, STORIES } from '@/data'
import { useAnalysisStore } from '@/stores/analysis'
import type { SortBy } from '@/stores/analysis'
import type { Reliability } from '@/types/analysis'

const store = useAnalysisStore()

const stories = computed(() => store.filteredStories)
const hasFilters = computed(
  () =>
    store.theme !== 'all' ||
    store.sortBy !== 'recent' ||
    store.minReliability !== 'all' ||
    store.query !== '',
)

function onSortBy(value: SortBy) {
  store.sortBy = value
}

function onReliability(value: Reliability | 'all') {
  store.minReliability = value
}
</script>

<template>
  <div class="page">
    <div class="cb-container">
      <header class="hero">
        <h1>Análises de cobertura no Brasil</h1>
        <p class="sub">
          Como os veículos de imprensa cobriram cada história — em três lentes: ideologia, tipo de
          veículo e região.
        </p>
      </header>

      <LensSwitcher v-model="store.lens" />

      <AnalysisFilters
        class="filters"
        :theme="store.theme"
        :sort-by="store.sortBy"
        :min-reliability="store.minReliability"
        :query="store.query"
        :themes="store.themes"
        :total="STORIES.length"
        :shown="stories.length"
        @update:theme="store.theme = $event"
        @update:sort-by="onSortBy"
        @update:min-reliability="onReliability"
        @update:query="store.query = $event"
        @reset="store.resetFilters()"
      />

      <div v-if="stories.length > 0" class="grid" data-test="grid">
        <StoryCard
          v-for="story in stories"
          :key="story.id"
          :story="story"
          :sources="SOURCES_BY_ID"
          :lens="store.lens"
        />
      </div>

      <div v-else class="empty" data-test="empty">
        <h2>Nenhuma análise encontrada</h2>
        <p>Ajuste os filtros ou limpe a busca para ver todas as histórias.</p>
        <button v-if="hasFilters" type="button" class="reset" @click="store.resetFilters()">
          Limpar filtros
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: var(--cb-space-6) 0 0;
}

.hero {
  margin-bottom: var(--cb-space-5);
}

h1 {
  font-size: 30px;
  line-height: 1.2;
  margin: 0 0 var(--cb-space-2);
  letter-spacing: -0.02em;
}

.sub {
  margin: 0 0 var(--cb-space-5);
  font-size: 15px;
  color: var(--cb-ink-2);
  max-width: 640px;
  line-height: 1.6;
}

.filters {
  margin-top: var(--cb-space-4);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--cb-space-5);
}

.empty {
  background: var(--cb-surface);
  border: 1px solid var(--cb-border);
  border-radius: var(--cb-radius-lg);
  padding: var(--cb-space-7);
  text-align: center;
}

.empty h2 {
  font-size: 17px;
  margin: 0 0 var(--cb-space-2);
}

.empty p {
  margin: 0 0 var(--cb-space-4);
  color: var(--cb-ink-3);
  font-size: 14px;
}

.reset {
  border: 1px solid var(--cb-border-strong);
  background: var(--cb-surface);
  border-radius: var(--cb-radius-sm);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cb-ink-2);
  cursor: pointer;
}

.reset:hover {
  color: var(--cb-accent);
  border-color: var(--cb-accent);
}

@media (max-width: 720px) {
  h1 {
    font-size: 24px;
  }
}
</style>
