<script setup lang="ts">
import type { Lens } from '@/types/analysis'

defineProps<{ lens: Lens }>()
</script>

<template>
  <ul class="legend">
    <li v-for="level in lens.levels" :key="level.id">
      <span class="dot" :style="{ background: level.color }" aria-hidden="true" />
      <span class="label">{{ level.label }}</span>
    </li>
  </ul>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cb-space-3);
  list-style: none;
  margin: 0;
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
}
</style>
