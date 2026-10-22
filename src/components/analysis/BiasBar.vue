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

const visible = computed(() =>
  props.slices
    .map((slice, index) => ({ slice, index }))
    .filter(({ slice }) => slice.count > 0),
)

/** Abaixo desta fatia o rótulo numérico não cabe dentro do segmento. */
const MIN_LABEL_SHARE = 0.12

function parseHex(color: string): [number, number, number] {
  const hex = color.replace('#', '')
  const full = hex.length === 3 ? [...hex].map((char) => char + char).join('') : hex
  const value = Number.parseInt(full, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

/** Mistura duas cores em partes iguais — usada nas bordas dos segmentos. */
function blend(left: string, right: string): string {
  const [r1, g1, b1] = parseHex(left)
  const [r2, g2, b2] = parseHex(right)
  const channel = (a: number, b: number) => Math.round((a + b) / 2)
  return `rgb(${channel(r1, r2)} ${channel(g1, g2)} ${channel(b1, b2)})`
}

function isLight(color: string): boolean {
  const [r, g, b] = parseHex(color)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62
}

function backgroundFor(index: number): string {
  const current = props.slices[index]
  if (!current) return 'transparent'

  const previous = props.slices[index - 1]
  const next = props.slices[index + 1]
  const color = current.level.color

  const start = previous && previous.count > 0 ? blend(previous.level.color, color) : color
  const end = next && next.count > 0 ? blend(color, next.level.color) : color
  return `linear-gradient(90deg, ${start}, ${color} 50%, ${end})`
}

const ariaLabel = computed(() => {
  if (visible.value.length === 0) return 'Nenhum veículo publicando sobre esta história'
  const parts = visible.value.map(
    ({ slice }) => `${slice.level.label} ${formatPercent(slice.share)}`,
  )
  return `Distribuição da cobertura: ${parts.join(', ')}`
})
</script>

<template>
  <div class="bar-wrap" :class="`size-${props.size}`" role="img" :aria-label="ariaLabel">
    <div class="bar" data-test="bar">
      <div
        v-for="entry in visible"
        :key="entry.slice.level.id"
        class="segment"
        data-test="segment"
        :style="{ width: `${entry.slice.share * 100}%`, background: backgroundFor(entry.index) }"
        :title="`${entry.slice.level.label} — ${entry.slice.count} ${
          entry.slice.count === 1 ? 'veículo' : 'veículos'
        } (${formatPercent(entry.slice.share)})`"
      >
        <span
          v-if="props.showValues && entry.slice.share >= MIN_LABEL_SHARE"
          class="value"
          :style="{ color: isLight(entry.slice.level.color) ? '#111827' : '#ffffff' }"
          >{{ formatPercent(entry.slice.share) }}</span
        >
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
  box-shadow: inset 0 0 0 1px rgb(17 24 39 / 8%);
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
  filter: brightness(1.06);
}

.value {
  font-size: 10px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
