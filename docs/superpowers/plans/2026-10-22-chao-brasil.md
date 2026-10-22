# Chão Brasil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma página de análises que mostra, para cada história em alta no Brasil, como a cobertura está distribuída entre veículos — em três lentes alternáveis (ideologia, tipo de veículo, região) — com selo de assimetria, evolução temporal, score de confiabilidade, comparação entre veículos, resumo do debate e gráfico de cobertura.

**Architecture:** Domínio-first. Todo o cálculo de análise vive em funções puras em `src/lib/analysis.ts`, testadas com Vitest; o dataset curado vive em `src/data/` como módulos TypeScript; Pinia guarda apenas estado de UI (lente ativa, filtros, ordenação); componentes Vue são apresentacionais e recebem props tipadas. Zero dependências novas — os gráficos são SVG desenhados à mão.

**Tech Stack:** Vue 3.5.44 + TypeScript + Vite 8 + Pinia 4 + Vue Router 5 + Vitest 4 + Vue Test Utils. Sem CSS framework, sem biblioteca de gráficos.

**Spec:** `docs/superpowers/specs/2026-10-22-chao-brasil-design.md`

## Global Constraints

- Working directory: `Vue-ground/`.
- **Zero dependências novas.** Nada de `chart.js`, `d3`, `tailwind`, `pinia-plugin-persist`. Gráficos em SVG à mão.
- Node `>=22.18.0` (ambiente: v22.22.1), npm 9.2.0. O `.npmrc` do projeto define `legacy-peer-deps=true` (bug `edgesOut` do arborist do npm 9 com este grafo de peers).
- `noUncheckedIndexedAccess: true` está ativo — indexações de array são `T | undefined` e precisam de guarda.
- Toda função em `src/lib/` é **pura** (sem DOM, sem `Date.now`, sem I/O) e tem teste.
- Toda fonte de dado tem identificador `kebab-case` estável; nenhuma referência por índice de array.
- Textos de UI em **português do Brasil**. Datas e percentuais em `pt-BR`.
- Cores de viés nunca são o único portador de informação: todo gráfico exibe rótulo textual e percentual junto.
- O dataset é **demonstrativo** (`DATASET_KIND = 'demonstrativo'`), declarado no rodapé e na página de metodologia.
- Comandos de verificação: `npm run test:unit -- --run`, `npm run type-check`, `npm run build`.

## Mapa de arquivos

| Arquivo | Responsabilidade única |
|---|---|
| `src/types/analysis.ts` | Tipos do domínio e uniões literais das 3 lentes |
| `src/data/brand.ts` | Nome, tagline, cor de acento, `DATASET_KIND` |
| `src/data/levels.ts` | As 3 lentes, níveis, cores, ordem, mapa de oposição |
| `src/data/sources.ts` | 40 veículos brasileiros |
| `src/data/stories.ts` | 18 histórias com 6–8 artigos cada |
| `src/data/index.ts` | Índices `SOURCES_BY_ID`, `STORIES_BY_SLUG`, `THEMES` |
| `src/lib/analysis.ts` | Funções puras de análise |
| `src/lib/format.ts` | `formatPercent`, `formatDateTime`, `formatRelativeTime`, `formatBucketLabel` |
| `src/stores/analysis.ts` | Pinia: `lens`, `theme`, `sortBy`, `minReliability`, `query`, `filteredStories` |
| `src/components/layout/AppHeader.vue` | Cabeçalho com marca e navegação |
| `src/components/analysis/*.vue` | Componentes apresentacionais |
| `src/views/*.vue` | `AnalysesView`, `StoryAnalysisView`, `MethodologyView`, `NotFoundView` |

---

## Fase 0 — Fundação

### Task 1: Repositório, design doc e tokens

- [x] **Step 1**: `git init -b main` + `npm install`
- [x] **Step 2**: `docs/superpowers/specs/2026-10-22-chao-brasil-design.md`
- [x] **Step 3**: `src/assets/tokens.css`
- [x] **Step 4**: reescrever `src/assets/main.css` (remover o grid `1fr 1fr` do scaffold)
- [x] **Step 5**: `src/data/brand.ts`
- [x] **Step 6**: `npm run type-check`
- [x] **Step 7**: commit

### Task 2: Tipos do domínio — `src/types/analysis.ts`

- [x] Step 1: criar o arquivo com as uniões literais `IDEOLOGY_LEVELS`, `VEHICLE_TYPE_LEVELS`, `REGION_LEVELS` e as interfaces `Level`, `Lens`, `Source`, `Article`, `Story`
- [x] Step 2: `npm run type-check`
- [x] Step 3: commit

### Task 3: As três lentes e formatação

- [x] Step 1: teste falhando `src/lib/__tests__/format.spec.ts`
- [x] Step 2: `npm run test:unit -- --run src/lib/__tests__/format.spec.ts` → FAIL
- [x] Step 3: implementar `src/lib/format.ts`
- [x] Step 4: teste → PASS
- [x] Step 5: criar `src/data/levels.ts`
- [x] Step 6: `npm run type-check`
- [x] Step 7: commit

### Task 4: Dataset de veículos (40) — `src/data/sources.ts`

- [x] Step 1: criar o arquivo com os 40 veículos e seus ratings nas 3 lentes
- [x] Step 2: conferir contagem e unicidade de ids
- [x] Step 3: `npm run type-check`
- [x] Step 4: commit

### Task 5: Dataset de histórias (18) — `src/data/stories.ts`

- [x] Step 1: criar o arquivo com as 18 histórias e seus artigos (títulos/excertos reescritos em português fluente, `publishedAt` crescente)
- [x] Step 2: `npm run type-check`
- [x] Step 3: commit

### Task 6: Índices e teste de integridade

- [x] Step 1: teste falhando `src/data/__tests__/dataset.spec.ts`
- [x] Step 2: FAIL
- [x] Step 3: criar `src/data/index.ts`
- [x] Step 4: PASS (7 testes)
- [x] Step 5: commit

## Fase 2 — Motor de análise

### Task 7: `distribution()` + `dominantSlice()`

- [x] Step 1: teste falhando `src/lib/__tests__/analysis.spec.ts`
- [x] Step 2: FAIL
- [x] Step 3: implementar em `src/lib/analysis.ts`
- [x] Step 4: PASS (6 testes)
- [x] Step 5: commit

### Task 8: `asymmetry()`

- [x] Step 1: testes que falham (ideologia e concentração)
- [x] Step 2: FAIL
- [x] Step 3: implementar
- [x] Step 4: PASS (12 testes)
- [x] Step 5: commit

### Task 9: `coverageTimeline()`, `firstReported()`, `groupArticlesByLevel()`, `compareSources()`

- [x] Step 1: testes que falham
- [x] Step 2: FAIL
- [x] Step 3: implementar + `formatBucketLabel`
- [x] Step 4: PASS (18 testes)
- [x] Step 5: commit

## Fase 3 — Estado e componentes

### Task 10: Store Pinia — `src/stores/analysis.ts`

- [x] Step 1: teste falhando
- [x] Step 2: FAIL
- [x] Step 3: implementar
- [x] Step 4: PASS (7 testes)
- [x] Step 5: commit

### Task 11: `SourceAvatar`, `LevelLegend`, `BiasBar`

- [x] Step 1: teste falhando `BiasBar.spec.ts`
- [x] Step 2: FAIL
- [x] Steps 3–5: implementar os três componentes
- [x] Step 6: PASS (5 testes)
- [x] Step 7: commit

### Task 12: `LensSwitcher`, `AsymmetryBadge`, `StoryCard`

- [x] Step 1: teste falhando `StoryCard.spec.ts`
- [x] Step 2: FAIL
- [x] Steps 3–5: implementar
- [x] Step 6: PASS (5 testes)
- [x] Step 7: commit

### Task 14: `TimelineChart` (SVG)

- [x] Step 1: teste falhando
- [x] Step 2: FAIL
- [x] Step 3: implementar
- [x] Step 4: PASS (4 testes)
- [x] Step 5: commit

### Task 15: `CoverageComparison`

- [x] Step 1: teste falhando
- [x] Step 2: FAIL
- [x] Step 3: implementar
- [x] Step 4: PASS
- [x] Step 5: commit

### Task 13: `ArticleRow` + `StoryAnalysisView`

- [x] Step 1: teste falhando
- [x] Step 2: FAIL
- [x] Steps 3–4: implementar
- [x] Step 5: PASS
- [x] Step 6: commit

## Fase 4 — Páginas e navegação

### Task 16: `AnalysisFilters`, `AnalysesView`, `MethodologyPanel`, `MethodologyView`, `AppHeader`, rotas, `App.vue`

- [x] Step 1: testes que falham
- [x] Step 2: FAIL
- [x] Step 3: implementar
- [x] Step 4: PASS
- [x] Step 5: commit

### Task 17: `NotFoundView`, rodapé de demonstração, responsivo, acessibilidade

- [x] Step 1: testes que falham
- [x] Step 2: FAIL
- [x] Step 3: implementar
- [x] Step 4: PASS
- [x] Step 5: commit

### Task 18: Verificação final

- [x] `npm run test:unit -- --run`
- [x] `npm run type-check`
- [x] `npm run build`
