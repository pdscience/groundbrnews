<script setup lang="ts">
import { computed } from 'vue'
import { formatPercent } from '@/lib/format'
import type { DistributionSlice } from '@/lib/analysis'
import type { Lens } from '@/types/analysis'

const props = defineProps<{
  lens: Lens
  slices?: DistributionSlice[]
}>()

const byLevel = computed(
  () => new Map((props.slices ?? []).map((slice) => [slice.level.id, slice])),
)

function shareOf(levelId: string): number {
  return byLevel.value.get(levelId as DistributionSlice['level']['id'])?.share ?? 0
}

function countOf(levelId: string): number {
  return byLevel.value.get(levelId as DistributionSlice['level']['id'])?.count ?? 0
}
</script>

<template>
  <ul class="legend">
    <li
      v-for="level in lens.levels"
      :key="level.id"
      :title="slices ? `${countOf(level.id)} veículos` : undefined"
    >
      <span class="dot" :style="{ background: level.color }" aria-hidden="true" />
      <span class="label">{{ level.label }}</span>
      <span v-if="slices" class="share">{{ formatPercent(shareOf(level.id)) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cb-space-2) var(--cb-space-4);
  list-style: none;
  margin: var(--cb-space-3) 0 0;
  padding: 0;
  font-size: 12px;
  color: var(--cb-ink-3);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
  box-shadow: inset 0 0 0 1px rgb(17 24 39 / 18%);
}

.label {
  white-space: nowrap;
}

.share {
  color: var(--cb-ink);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
