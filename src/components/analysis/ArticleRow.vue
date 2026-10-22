<script setup lang="ts">
import { computed } from 'vue'
import SourceAvatar from './SourceAvatar.vue'
import { formatRelativeTime } from '@/lib/format'
import type { Article, Source } from '@/types/analysis'

const props = withDefaults(defineProps<{ article: Article; source?: Source; now?: Date }>(), {
  now: () => new Date(),
})

const STANCE_LABEL: Record<Article['stance'], string> = {
  support: 'Apoia',
  critical: 'Critica',
  neutral: 'Neutro',
  mixed: 'Misto',
}

const RELIABILITY_LABEL: Record<Source['reliability'], string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

const relative = computed(() => formatRelativeTime(props.article.publishedAt, props.now))
</script>

<template>
  <li class="row">
    <SourceAvatar v-if="props.source" :source="props.source" :size="28" />
    <span v-else class="unknown" aria-hidden="true">?</span>

    <div class="body">
      <div class="meta">
        <strong class="name">{{ props.source?.name ?? 'Veículo desconhecido' }}</strong>
        <span
          v-if="props.source"
          class="rel"
          :class="props.source.reliability"
        >{{ RELIABILITY_LABEL[props.source.reliability] }}</span>
        <span class="stance">{{ STANCE_LABEL[props.article.stance] }}</span>
        <span class="time">{{ relative }}</span>
      </div>
      <a
        class="headline"
        :href="props.article.url"
        target="_blank"
        rel="noopener noreferrer"
      >{{ props.article.title }}</a>
      <p class="excerpt">{{ props.article.excerpt }}</p>
    </div>
  </li>
</template>

<style scoped>
.row {
  display: flex;
  gap: var(--cb-space-3);
  padding: var(--cb-space-4) 0;
  border-bottom: 1px solid var(--cb-border);
  list-style: none;
}

.row:last-child {
  border-bottom: 0;
}

.body {
  min-width: 0;
  flex: 1;
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--cb-space-2);
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--cb-ink-3);
}

.name {
  color: var(--cb-ink);
  font-size: 13px;
}

.rel {
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rel.high {
  background: #d1fae5;
  color: #065f46;
}

.rel.medium {
  background: #fef3c7;
  color: #92400e;
}

.rel.low {
  background: #fee2e2;
  color: #991b1b;
}

.stance {
  font-style: italic;
}

.headline {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
  line-height: 1.4;
}

.headline:hover {
  color: var(--cb-accent);
}

.excerpt {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--cb-ink-2);
  line-height: 1.5;
}

.unknown {
  width: 28px;
  height: 28px;
  border-radius: var(--cb-radius-sm);
  background: var(--cb-surface-3);
  color: var(--cb-ink-3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex: none;
}
</style>
