<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BiasBar from './BiasBar.vue'
import AsymmetryBadge from './AsymmetryBadge.vue'
import SourceAvatar from './SourceAvatar.vue'
import { asymmetry, distribution, firstReported } from '@/lib/analysis'
import { getLens } from '@/data/levels'
import type { LensId, Source, Story } from '@/types/analysis'

const props = defineProps<{ story: Story; sources: Map<string, Source>; lens: LensId }>()

const lensDef = computed(() => getLens(props.lens))
const slices = computed(() => distribution(props.story, props.sources, props.lens))
const asym = computed(() => asymmetry(props.story, props.sources, props.lens))
const first = computed(() => firstReported(props.story))
const firstSource = computed(() => (first.value ? props.sources.get(first.value.sourceId) : undefined))
const vehicleCount = computed(() => new Set(props.story.articles.map((a) => a.sourceId)).size)
const regionLabel = computed(
  () => lensDef.value.levels.find((l) => l.id === props.story.region)?.label ?? props.story.state,
)
</script>

<template>
  <article class="card">
    <div class="chips">
      <span class="chip theme">{{ props.story.theme }}</span>
      <span class="chip">{{ regionLabel }}</span>
    </div>

    <h3 class="title">
      <RouterLink :to="`/analises/${props.story.slug}`">{{ props.story.title }}</RouterLink>
    </h3>

    <BiasBar :slices="slices" size="sm" />

    <div class="meta">
      <span>{{ vehicleCount }} veículos</span>
      <AsymmetryBadge :asymmetry="asym" />
    </div>

    <div v-if="firstSource" class="first">
      <SourceAvatar :source="firstSource" :size="22" />
      <span>Primeiro a publicar: <strong>{{ firstSource.name }}</strong></span>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: var(--cb-surface);
  border: 1px solid var(--cb-border);
  border-radius: var(--cb-radius-lg);
  padding: var(--cb-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--cb-space-3);
  box-shadow: var(--cb-shadow-card);
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.card:hover {
  box-shadow: var(--cb-shadow-pop);
  transform: translateY(-1px);
}

.chips {
  display: flex;
  gap: var(--cb-space-2);
  flex-wrap: wrap;
}

.chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--cb-surface-3);
  color: var(--cb-ink-2);
}

.chip.theme {
  background: var(--cb-accent-soft);
  color: var(--cb-accent);
}

.title {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 700;
}

.title a:hover {
  color: var(--cb-accent);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cb-space-2);
  font-size: 12px;
  color: var(--cb-ink-3);
}

.first {
  display: flex;
  align-items: center;
  gap: var(--cb-space-2);
  font-size: 12px;
  color: var(--cb-ink-3);
  border-top: 1px solid var(--cb-border);
  padding-top: var(--cb-space-3);
}
</style>
