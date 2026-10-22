<script setup lang="ts">
import type { Asymmetry } from '@/lib/analysis'

const props = defineProps<{ asymmetry: Asymmetry }>()
</script>

<template>
  <span
    v-if="props.asymmetry.flagged"
    class="badge"
    :class="props.asymmetry.severity"
    :title="props.asymmetry.reason"
  >
    Cobertura assimétrica
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.moderate {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.high {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}
</style>
