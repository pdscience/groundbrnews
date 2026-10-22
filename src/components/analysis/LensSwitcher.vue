<script setup lang="ts">
import { computed } from 'vue'
import { LENS_ORDER, LENSES } from '@/data/levels'
import type { LensId } from '@/types/analysis'

const props = defineProps<{ modelValue: LensId }>()
const emit = defineEmits<{ 'update:modelValue': [value: LensId] }>()

const description = computed(() => LENSES[props.modelValue].description)

function select(id: LensId) {
  emit('update:modelValue', id)
}
</script>

<template>
  <div class="switcher">
    <div class="tabs" role="tablist" aria-label="Lente de análise">
      <button
        v-for="id in LENS_ORDER"
        :key="id"
        class="tab"
        role="tab"
        type="button"
        :aria-selected="props.modelValue === id"
        :class="{ active: props.modelValue === id }"
        @click="select(id)"
      >{{ LENSES[id].label }}</button>
    </div>
    <p class="desc">{{ description }}</p>
  </div>
</template>

<style scoped>
.switcher {
  display: flex;
  flex-direction: column;
  gap: var(--cb-space-2);
}

.tabs {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--cb-surface-3);
  border-radius: 999px;
  align-self: flex-start;
}

.tab {
  border: 0;
  background: transparent;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cb-ink-2);
  cursor: pointer;
  white-space: nowrap;
}

.tab.active {
  background: var(--cb-surface);
  color: var(--cb-ink);
  box-shadow: var(--cb-shadow-card);
}

.desc {
  margin: 0;
  font-size: 13px;
  color: var(--cb-ink-3);
  line-height: 1.5;
}
</style>
