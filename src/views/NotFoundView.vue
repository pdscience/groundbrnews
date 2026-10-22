<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page">
    <div class="cb-container">
      <div class="box">
        <p class="code">404</p>
        <h1>Não encontramos esta análise</h1>
        <p class="sub">
          A história que você procura não existe no dataset — ou o endereço está errado.
        </p>
        <RouterLink to="/analises" class="cta">Voltar para as análises</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: var(--cb-space-7) 0;
}

.box {
  background: var(--cb-surface);
  border: 1px solid var(--cb-border);
  border-radius: var(--cb-radius-lg);
  padding: var(--cb-space-7);
  text-align: center;
  box-shadow: var(--cb-shadow-card);
}

.code {
  margin: 0;
  font-size: 44px;
  font-weight: 800;
  color: var(--cb-border-strong);
  letter-spacing: -0.04em;
}

h1 {
  font-size: 22px;
  margin: var(--cb-space-2) 0 var(--cb-space-2);
  letter-spacing: -0.02em;
}

.sub {
  margin: 0 0 var(--cb-space-5);
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

.cta:hover {
  filter: brightness(1.06);
}
</style>
