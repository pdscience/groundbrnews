<script setup lang="ts">
import { computed } from 'vue'
import { formatPercent } from '@/lib/format'
import type { DistributionSlice } from '@/lib/analysis'

const props = withDefaults(
  defineProps<{
    slices: DistributionSlice[]
    size?: 'sm' | 'md' | 'lg'
    showValues?: boolean
  }>(),
  { size: 'md', showValues: false },
)

const visible = computed(() => props.slices.filter((s) => s.count > 0))

/** Abaixo desta fatia o rótulo numérico não cabe dentro do segmento. */
const MIN_LABEL_SHARE = 0.12

const ariaLabel = computed(() => {
  if (visible.value.length === 0) return 'Nenhum veículo publicando sobre esta história'
  const parts = visible.value.map((s) => `${s.level.label} ${formatPercent(s.share)}`)
  return `Distribuição da cobertura: ${parts.join(', ')}`
})
</script>

<template>
  <div class="bar-wrap" :class="`size-${props.size}`" role="img" :aria-label="ariaLabel">
    <div class="bar" data-test="bar">
      <div
        v-for="slice in visible"
        :key="slice.level.id"
        class="segment"
        data-test="segment"
        :style="{ width: `${slice.share * 100}%`, background: slice.level.color }"
        :title="`${slice.level.label} — ${slice.count} ${
          slice.count === 1 ? 'veículo' : 'veículos'
        } (${formatPercent(slice.share)})`"
      >
        <span v-if="props.showValues && slice.share >= MIN_LABEL_SHARE" class="value">{{
          formatPercent(slice.share)
        }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar-wrap {
  width: 100%;
}

.bar {
  display: flex;
  width: 100%;
  border-radius: 999px;
  overflow: hidden;
  background: var(--cb-surface-3);
}

.size-sm .bar {
  height: 6px;
}

.size-md .bar {
  height: 10px;
}

.size-lg .bar {
  height: 18px;
}

.segment {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2px;
  overflow: hidden;
  transition: filter 0.15s ease;
}

.segment:hover {
  filter: brightness(1.08);
}

.value {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
  white-space: nowrap;
}
</style>
