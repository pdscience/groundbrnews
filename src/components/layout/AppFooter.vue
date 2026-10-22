<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BRAND, DATASET_KIND } from '@/data/brand'
</script>

<template>
  <footer class="footer">
    <div class="cb-container inner">
      <p class="note">
        <strong>{{ BRAND.name }}</strong> — {{ BRAND.tagline }}.
        <span class="disclaimer">
          Dataset {{ DATASET_KIND }}: as histórias e os links são ilustrativos, com veículos reais e
          ratings editoriais atribuídos a dedo para fins de demonstração.
        </span>
      </p>
      <nav aria-label="Navegação do rodapé">
        <RouterLink to="/analises">Análises</RouterLink>
        <RouterLink to="/metodologia">Metodologia</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--cb-border);
  background: var(--cb-surface);
  margin-top: var(--cb-space-7);
}

.inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cb-space-4);
  padding: var(--cb-space-5) var(--cb-space-5);
  flex-wrap: wrap;
}

.note {
  margin: 0;
  font-size: 12px;
  color: var(--cb-ink-2);
  max-width: 640px;
  line-height: 1.6;
}

.disclaimer {
  display: block;
  color: var(--cb-ink-3);
}

nav {
  display: flex;
  gap: var(--cb-space-4);
  font-size: 12px;
  font-weight: 600;
  color: var(--cb-ink-3);
}

nav a:hover {
  color: var(--cb-accent);
}
</style>
