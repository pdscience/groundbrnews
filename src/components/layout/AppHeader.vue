<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BRAND } from '@/data/brand'

const links = [
  { to: '/analises', label: 'Análises' },
  { to: '/metodologia', label: 'Metodologia' },
]
</script>

<template>
  <header class="header">
    <div class="cb-container inner">
      <RouterLink to="/analises" class="brand">
        <span class="mark" aria-hidden="true">{{ BRAND.logoMark }}</span>
        <span class="names">
          <strong class="name">{{ BRAND.name }}</strong>
          <span class="tagline">{{ BRAND.tagline }}</span>
        </span>
      </RouterLink>

      <nav aria-label="Navegação principal">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="nav-link">
          {{ link.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--cb-surface);
  border-bottom: 1px solid var(--cb-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cb-space-4);
  min-height: 60px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--cb-space-3);
}

.mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--cb-radius-sm);
  background: var(--cb-accent);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: -0.03em;
  flex: none;
}

.names {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.name {
  font-size: 15px;
  letter-spacing: -0.01em;
}

.tagline {
  font-size: 11px;
  color: var(--cb-ink-3);
}

nav {
  display: flex;
  gap: var(--cb-space-4);
}

.nav-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--cb-ink-2);
  padding: 6px 2px;
  border-bottom: 2px solid transparent;
}

.nav-link:hover {
  color: var(--cb-ink);
}

.nav-link.router-link-active {
  color: var(--cb-accent);
  border-bottom-color: var(--cb-accent);
}

@media (max-width: 640px) {
  .tagline {
    display: none;
  }
}
</style>
