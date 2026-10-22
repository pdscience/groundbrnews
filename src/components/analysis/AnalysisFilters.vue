<script setup lang="ts">
import type { SortBy } from '@/stores/analysis'
import type { Reliability } from '@/types/analysis'

const props = defineProps<{
  theme: string
  sortBy: SortBy
  minReliability: Reliability | 'all'
  query: string
  themes: string[]
  total: number
  shown: number
}>()

const emit = defineEmits<{
  'update:theme': [value: string]
  'update:sortBy': [value: SortBy]
  'update:minReliability': [value: Reliability | 'all']
  'update:query': [value: string]
  reset: []
}>()

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'asymmetry', label: 'Maior assimetria' },
  { value: 'sources', label: 'Mais veículos' },
]

const RELIABILITY_OPTIONS: { value: Reliability | 'all'; label: string }[] = [
  { value: 'all', label: 'Toda a cobertura' },
  { value: 'high', label: 'Confiabilidade alta' },
  { value: 'medium', label: 'Confiabilidade média ou alta' },
  { value: 'low', label: 'Toda a cobertura' },
]
</script>

<template>
  <div class="filters">
    <label class="field search">
      <span class="label">Buscar</span>
      <input
        type="search"
        :value="props.query"
        placeholder="Título, veículo, debate…"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <label class="field">
      <span class="label">Tema</span>
      <select
        :value="props.theme"
        @change="emit('update:theme', ($event.target as HTMLSelectElement).value)"
      >
        <option value="all">Todos os temas</option>
        <option v-for="t in props.themes" :key="t" :value="t">{{ t }}</option>
      </select>
    </label>

    <label class="field">
      <span class="label">Confiabilidade</span>
      <select
        :value="props.minReliability"
        @change="
          emit('update:minReliability', ($event.target as HTMLSelectElement).value as Reliability | 'all')
        "
      >
        <option v-for="option in RELIABILITY_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>

    <label class="field">
      <span class="label">Ordenar por</span>
      <select
        :value="props.sortBy"
        @change="emit('update:sortBy', ($event.target as HTMLSelectElement).value as SortBy)"
      >
        <option v-for="option in SORT_OPTIONS" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>

    <button type="button" class="reset" @click="emit('reset')">Limpar</button>

    <p class="count" aria-live="polite">
      {{ props.shown }} de {{ props.total }} histórias
    </p>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  align-items: flex-end;
  gap: var(--cb-space-4);
  flex-wrap: wrap;
  padding: var(--cb-space-4) var(--cb-space-5);
  background: var(--cb-surface);
  border: 1px solid var(--cb-border);
  border-radius: var(--cb-radius-lg);
  box-shadow: var(--cb-shadow-card);
  margin-bottom: var(--cb-space-5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field.search {
  flex: 1;
  min-width: 220px;
}

.label {
  font-size: 11px;
  font-weight: 600;
  color: var(--cb-ink-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

input,
select {
  border: 1px solid var(--cb-border-strong);
  border-radius: var(--cb-radius-sm);
  padding: 8px 10px;
  font-size: 13px;
  background: var(--cb-surface);
  color: var(--cb-ink);
  width: 100%;
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

.count {
  margin: 0 0 0 auto;
  font-size: 12px;
  color: var(--cb-ink-3);
  white-space: nowrap;
}
</style>
