<script setup lang="ts">
import { computed } from 'vue'
import type { TimelinePoint } from '@/lib/analysis'
import type { Lens } from '@/types/analysis'

const props = defineProps<{ points: TimelinePoint[]; lens: Lens }>()

const W = 720
const H = 200
const PAD = { top: 10, right: 8, bottom: 26, left: 30 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

const max = computed(() => Math.max(1, ...props.points.map((p) => p.total)))

const bars = computed(() => {
  const count = props.points.length
  if (count === 0) return []
  const slot = INNER_W / count
  const width = Math.max(4, slot * 0.62)

  return props.points.map((point, index) => {
    let offset = 0
    const segments = props.lens.levels
      .filter((level) => (point.byLevel[level.id] ?? 0) > 0)
      .map((level) => {
        const value = point.byLevel[level.id] ?? 0
        const height = (value / max.value) * INNER_H
        const rect = {
          level,
          value,
          y: PAD.top + INNER_H - offset - height,
          height,
          x: PAD.left + index * slot + (slot - width) / 2,
          width,
        }
        offset += height
        return rect
      })

    return {
      point,
      index,
      x: PAD.left + index * slot + (slot - width) / 2,
      width,
      segments,
    }
  })
})

const labelStep = computed(() => Math.max(1, Math.ceil(props.points.length / 6)))

const summary = computed(() => {
  if (props.points.length === 0) return 'Evolução da cobertura: sem dados'
  const total = props.points.reduce((a, p) => a + p.total, 0)
  const first = props.points[0]!
  const last = props.points[props.points.length - 1]!
  return `Evolução da cobertura: ${total} publicações entre ${first.label} e ${last.label}`
})
</script>

<template>
  <div class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" :aria-label="summary" role="img">
      <line
        :x1="PAD.left"
        :y1="PAD.top + INNER_H"
        :x2="W - PAD.right"
        :y2="PAD.top + INNER_H"
        stroke="#e5e7eb"
      />
      <text :x="PAD.left - 8" :y="PAD.top + 10" text-anchor="end" font-size="10" fill="#6b7280">
        {{ max }}
      </text>
      <text
        :x="PAD.left - 8"
        :y="PAD.top + INNER_H"
        text-anchor="end"
        font-size="10"
        fill="#6b7280"
      >0</text>

      <g v-for="bar in bars" :key="bar.point.bucket" data-test="bar">
        <rect
          v-for="segment in bar.segments"
          :key="segment.level.id"
          :x="segment.x"
          :y="segment.y"
          :width="segment.width"
          :height="segment.height"
          :fill="segment.level.color"
          rx="2"
        >
          <title>{{ segment.level.label }} — {{ segment.value }} veículos</title>
        </rect>
        <text
          v-if="bar.index % labelStep === 0"
          :x="bar.x + bar.width / 2"
          :y="H - 8"
          text-anchor="middle"
          font-size="10"
          fill="#6b7280"
        >{{ bar.point.label }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.chart {
  width: 100%;
  overflow-x: auto;
}

svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>
