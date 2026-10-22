<script setup lang="ts">
import type { Source } from '@/types/analysis'

const props = withDefaults(defineProps<{ source: Source; size?: number }>(), { size: 32 })
</script>

<template>
  <span
    class="avatar"
    :style="{
      width: `${props.size}px`,
      height: `${props.size}px`,
      background: props.source.brandColor,
      fontSize: `${Math.round(props.size * 0.4)}px`,
    }"
    :title="props.source.name"
    :aria-label="props.source.name"
    role="img"
  >{{ props.source.monogram }}</span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--cb-radius-sm);
  color: #fff;
  font-weight: 700;
  letter-spacing: -0.02em;
  flex: none;
  overflow: hidden;
}
</style>
