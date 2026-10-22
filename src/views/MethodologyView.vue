<script setup lang="ts">
import { LENSES, LENS_ORDER } from '@/data/levels'
import { DATASET_KIND } from '@/data/brand'
</script>

<template>
  <div class="page">
    <div class="cb-container">
      <header class="head">
        <h1>Metodologia</h1>
        <p class="sub">
          Como o Chão Brasil classifica veículos, agrupa Reporting e sinaliza assimetrias de
          cobertura.
        </p>
      </header>

      <section class="cb-panel">
        <h2>As três lentes</h2>
        <p class="lead">
          Cada veículo recebe um rating em cada uma das lentes abaixo. Trocar de lente muda o que
          a barra de distribuição mostra — sem recalcular nada, porque a classificação já está no
          veículo.
        </p>

        <div v-for="id in LENS_ORDER" :key="id" class="lens">
          <h3>{{ LENSES[id].label }}</h3>
          <p class="lens-desc">{{ LENSES[id].description }}</p>
          <ul class="levels">
            <li v-for="level in LENSES[id].levels" :key="level.id">
              <span class="dot" :style="{ background: level.color }" aria-hidden="true" />
              <span class="level-label">{{ level.label }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="cb-panel">
        <h2>Selo de assimetria de cobertura</h2>
        <p class="lead">
          O selo aparece quando a cobertura de uma história está concentrada de forma
          desproporcional em um dos lados — ou, nas lentes de concentração, em uma única categoria
          de veículos.
        </p>

        <h3 class="rule-title">Lente ideologia</h3>
        <ul class="rules">
          <li>O lado esquerdo soma <em>Esquerda</em> e <em>Centro-esquerda</em>; o direito soma <em>Centro-direita</em> e <em>Direita</em>. Veículos centrais não contam para nenhum dos lados.</li>
          <li>A história é sinalizada quando um lado tem <strong>55% ou mais</strong> da cobertura <strong>e</strong> o outro tem <strong>30% ou menos</strong>.</li>
          <li>É preciso haver pelo menos <strong>5 veículos</strong> publicando.</li>
          <li>Severidade alta a partir de <strong>80%</strong> de concentração; moderada entre 55% e 80%.</li>
        </ul>

        <h3 class="rule-title">Lentes de concentração (tipo de veículo e região)</h3>
        <ul class="rules">
          <li>A história é sinalizada quando uma única categoria reúne <strong>60% ou mais</strong> da cobertura <strong>e</strong> a segunda categoria fica com <strong>20% ou menos</strong>.</li>
          <li>É preciso haver pelo menos <strong>5 veículos</strong> publicando.</li>
          <li>Severidade alta a partir de <strong>80%</strong> de concentração.</li>
        </ul>

        <p class="note">
          O selo nunca é aplicado a um artigo específico — sempre à cobertura da história inteira, e
          os números usados ficam visíveis na página da análise.
        </p>
      </section>

      <section class="cb-panel">
        <h2>Score de confiabilidade</h2>
        <p class="lead">
          Cada veículo recebe um nível de confiabilidade editorial — alta, média ou baixa — que
          aparece ao lado do nome do veículo e pode ser usado como filtro no hub. Ele não entra no
          cálculo da assimetria: serve para que o leitor know o peso de cada fonte ao interpretar o
          gráfico.
        </p>
      </section>

      <section class="cb-panel">
        <h2>Sobre os dados</h2>
        <p class="lead">
          Este é um dataset {{ DATASET_KIND }}. Os veículos e seus ratings editoriais são reais e
          foram atribuídos a dedo segundo as linhas editoriais de cada outlets; as histórias, os
          títulos e os excertos são ilustrativos, e os links apontam para URLs de exemplo.
        </p>
        <p class="lead">
          A arquitetura foi desenhada para que a troca por dados reais aconteça apenas na camada de
          dados — o cálculo, a interface e os testes permanecem iguais.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: var(--cb-space-6) 0 var(--cb-space-7);
}

.head {
  margin-bottom: var(--cb-space-5);
}

h1 {
  font-size: 30px;
  line-height: 1.2;
  margin: 0 0 var(--cb-space-2);
  letter-spacing: -0.02em;
}

.sub {
  margin: 0;
  font-size: 15px;
  color: var(--cb-ink-2);
  max-width: 640px;
  line-height: 1.6;
}

h2 {
  font-size: 16px;
  margin: 0 0 var(--cb-space-3);
}

h3 {
  font-size: 14px;
  margin: var(--cb-space-4) 0 var(--cb-space-2);
}

.rule-title {
  margin-top: var(--cb-space-4);
}

.lead {
  margin: 0 0 var(--cb-space-4);
  font-size: 14px;
  color: var(--cb-ink-2);
  line-height: 1.6;
  max-width: 720px;
}

.lens {
  padding: var(--cb-space-3) 0;
  border-top: 1px solid var(--cb-border);
}

.lens-desc {
  margin: 0 0 var(--cb-space-3);
  font-size: 13px;
  color: var(--cb-ink-3);
}

.levels {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--cb-space-3);
}

.levels li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--cb-ink-2);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex: none;
}

.rules {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  color: var(--cb-ink-2);
  line-height: 1.7;
}

.note {
  margin: var(--cb-space-4) 0 0;
  font-size: 13px;
  color: var(--cb-ink-3);
  padding: var(--cb-space-3) var(--cb-space-4);
  background: var(--cb-surface-2);
  border-radius: var(--cb-radius);
  border-left: 3px solid var(--cb-accent);
}

@media (max-width: 720px) {
  h1 {
    font-size: 24px;
  }
}
</style>
