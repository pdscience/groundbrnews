<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import LensSwitcher from '@/components/analysis/LensSwitcher.vue'
import BiasBar from '@/components/analysis/BiasBar.vue'
import LevelLegend from '@/components/analysis/LevelLegend.vue'
import AsymmetryBadge from '@/components/analysis/AsymmetryBadge.vue'
import ArticleRow from '@/components/analysis/ArticleRow.vue'
import TimelineChart from '@/components/analysis/TimelineChart.vue'
import CoverageComparison from '@/components/analysis/CoverageComparison.vue'
import SourceAvatar from '@/components/analysis/SourceAvatar.vue'
import { SOURCES_BY_ID, STORIES_BY_SLUG } from '@/data'
import { getLens } from '@/data/levels'
import { useAnalysisStore } from '@/stores/analysis'
import {
  asymmetry,
  coverageTimeline,
  distribution,
  firstReported,
  groupArticlesByLevel,
  storySources,
} from '@/lib/analysis'
import { formatPercent } from '@/lib/format'

const route = useRoute()
const store = useAnalysisStore()

const story = computed(() => STORIES_BY_SLUG.get(String(route.params.slug)))
const lensDef = computed(() => getLens(store.lens))
const slices = computed(() => (story.value ? distribution(story.value, SOURCES_BY_ID, store.lens) : []))
const asym = computed(() => (story.value ? asymmetry(story.value, SOURCES_BY_ID, store.lens) : null))
const grouped = computed(() =>
  story.value ? groupArticlesByLevel(story.value, SOURCES_BY_ID, store.lens) : new Map(),
)
const timeline = computed(() =>
  story.value ? coverageTimeline(story.value, SOURCES_BY_ID, store.lens) : { granularity: 'day' as const, points: [] },
)
const first = computed(() => (story.value ? firstReported(story.value) : null))
const firstSource = computed(() => (first.value ? SOURCES_BY_ID.get(first.value.sourceId) : undefined))
const vehicles = computed(() => (story.value ? storySources(story.value, SOURCES_BY_ID) : []))
</script>

<template>
  <div v-if="!story" class="page">
    <div class="cb-container">
      <div class="cb-panel missing">
        <h1>Análise não encontrada</h1>
        <p>A história que você procura não existe no dataset.</p>
        <RouterLink to="/analises" class="cta">Voltar para as análises</RouterLink>
      </div>
    </div>
  </div>

  <div v-else class="page">
    <div class="cb-container">
      <RouterLink to="/analises" class="back">← Todas as análises</RouterLink>

      <header class="head">
        <div class="chips">
          <span class="chip theme">{{ story.theme }}</span>
          <span class="chip">{{ story.state }}</span>
          <span class="chip">{{ vehicles.length }} veículos</span>
        </div>
        <h1>{{ story.title }}</h1>
      </header>

      <section class="cb-panel">
        <LensSwitcher v-model="store.lens" />
        <BiasBar :slices="slices" size="lg" show-values />
        <LevelLegend :lens="lensDef" :slices="slices" />
      </section>

      <section v-if="asym" class="cb-panel">
        <div class="asym-head">
          <h2>Análise de cobertura</h2>
          <AsymmetryBadge :asymmetry="asym" />
        </div>
        <p class="reason">{{ asym.reason }}</p>
        <dl class="stats">
          <div>
            <dt>Concentração</dt>
            <dd>{{ formatPercent(asym.dominantShare) }}</dd>
          </div>
          <div>
            <dt>Lado oposto</dt>
            <dd>{{ formatPercent(asym.oppositeShare) }}</dd>
          </div>
          <div>
            <dt>Veículos</dt>
            <dd>{{ asym.sourceCount }}</dd>
          </div>
        </dl>
      </section>

      <section class="cb-panel two-col">
        <div>
          <h2>Resumo</h2>
          <ul class="summary">
            <li v-for="item in story.summary" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div>
          <h2>O que está em debate</h2>
          <p class="debate">{{ story.debate }}</p>
          <p v-if="firstSource" class="first-note">
            Primeiro a publicar: <strong>{{ firstSource.name }}</strong>
          </p>
        </div>
      </section>

      <section class="cb-panel">
        <h2>Cobertura ao longo do tempo</h2>
        <TimelineChart :points="timeline.points" :lens="lensDef" />
      </section>

      <section class="cb-panel">
        <h2>Quem publicou</h2>
        <div v-for="level in lensDef.levels" :key="level.id" class="level-group">
          <h3>
            <span class="dot" :style="{ background: level.color }" aria-hidden="true" />
            {{ level.label }}
            <span class="count">{{ grouped.get(level.id)?.length ?? 0 }}</span>
          </h3>
          <ul class="articles">
            <ArticleRow
              v-for="article in grouped.get(level.id) ?? []"
              :key="article.id"
              :article="article"
              :source="SOURCES_BY_ID.get(article.sourceId)"
            />
          </ul>
        </div>
      </section>

      <section class="cb-panel">
        <h2>Comparar veículos</h2>
        <CoverageComparison :story="story" :sources="SOURCES_BY_ID" :lens="store.lens" />
      </section>

      <section class="cb-panel">
        <h2>Veículos que publicaram</h2>
        <div class="vehicles">
          <div v-for="vehicle in vehicles" :key="vehicle.id" class="vehicle">
            <SourceAvatar :source="vehicle" :size="36" />
            <span class="vehicle-name">{{ vehicle.name }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: var(--cb-space-6) 0 var(--cb-space-7);
}

.back {
  font-size: 13px;
  color: var(--cb-ink-3);
  font-weight: 600;
}

.back:hover {
  color: var(--cb-accent);
}

.head {
  margin: var(--cb-space-4) 0 var(--cb-space-5);
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

h1 {
  font-size: 30px;
  line-height: 1.2;
  margin: var(--cb-space-3) 0 0;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 15px;
  margin: 0 0 var(--cb-space-3);
}

h3 {
  font-size: 13px;
  margin: var(--cb-space-4) 0 var(--cb-space-2);
  display: flex;
  align-items: center;
  gap: 6px;
}

.asym-head {
  display: flex;
  align-items: center;
  gap: var(--cb-space-3);
}

.asym-head h2 {
  margin: 0;
}

.reason {
  margin: 0;
  font-size: 14px;
  color: var(--cb-ink-2);
  line-height: 1.55;
}

.stats {
  display: flex;
  gap: var(--cb-space-6);
  margin: 0;
  flex-wrap: wrap;
}

.stats dt {
  font-size: 11px;
  color: var(--cb-ink-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stats dd {
  margin: 2px 0 0;
  font-size: 20px;
  font-weight: 700;
}

.missing {
  text-align: center;
}

.missing h1 {
  font-size: 22px;
  margin: 0 0 var(--cb-space-2);
}

.missing p {
  margin: 0 0 var(--cb-space-4);
  color: var(--cb-ink-3);
  font-size: 14px;
}

.cta {
  display: inline-block;
  background: var(--cb-accent);
  color: #fff;
  padding: 10px 18px;
  border-radius: var(--cb-radius-sm);
  font-size: 14px;
  font-weight: 600;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--cb-space-6);
}

.summary {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
  color: var(--cb-ink-2);
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.debate {
  margin: 0;
  font-size: 14px;
  color: var(--cb-ink-2);
  line-height: 1.6;
}

.first-note {
  margin: var(--cb-space-3) 0 0;
  font-size: 13px;
  color: var(--cb-ink-3);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
  box-shadow: inset 0 0 0 1px rgb(17 24 39 / 18%);
}

.count {
  color: var(--cb-ink-3);
  font-weight: 600;
}

.articles {
  margin: 0;
  padding: 0;
}

.vehicles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cb-space-4);
}

.vehicle {
  display: flex;
  align-items: center;
  gap: var(--cb-space-2);
  font-size: 12px;
  color: var(--cb-ink-2);
}

@media (max-width: 720px) {
  .two-col {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 24px;
  }
}
</style>
