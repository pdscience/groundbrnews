# Chão Brasil — Design

> Status: aprovado. Implementado pelo plano `docs/superpowers/plans/2026-10-22-chao-brasil.md`.

## 1. Objetivo

Uma página de análises que mostra, para cada história em alta no Brasil, **como a cobertura está distribuída entre veículos** — em três lentes alternáveis — com selo de assimetria, evolução temporal, score de confiabilidade, comparação entre veículos, resumo do debate e gráfico de cobertura.

O modelo mental vem do Ground News ("see the bias in every story"), adapté ao cenário brasileiro.

## 2. Decisões tomadas

| Decisão | Escolha | Alternativas descartadas |
|---|---|---|
| Fonte de dados | Frontend-only com dataset curado (~40 veículos, ~18 histórias) | API real de notícias; full-stack com ingestão RSS |
| Eixo de análise | Três lentes alternáveis: ideologia, tipo de veículo, região | Só ideologia; só tipo de veículo |
| Escopo | Hub (`/analises`) + detalhe por história (`/analises/:slug`) | Só detalhe; só feed |
| Visual | Layout do Ground News com identidade própria | Clone visual; dashboard dark original |
| Recursos | Selo de assimetria, score de confiabilidade, evolução temporal, comparação entre veículos, resumo e "o que está em debate" | Núcleo mínimo |

## 3. Lentes

| Lente | Níveis | Eixo |
|---|---|---|
| Ideologia | Esquerda, Centro-esquerda, Centro, Centro-direita, Direita | espectro político |
| Tipo de veículo | Portal generalista, Jornal impresso, TV e streaming, Rádio e podcast, Portal de nicho, Imprensa alternativa | natureza editorial |
| Região | Sudeste, Sul, Nordeste, Norte, Centro-Oeste | sede do veículo |

Cada veículo recebe **um rating em cada lente**. Trocar a lente troca o campo lido — nenhum cálculo precisa ser refeito.

## 4. Modelo de dados

- `Source` — 40 veículos brasileiros: `ratings` nas 3 lentes, `reliability` (`high`/`medium`/`low`), `ownership`, `reach`, `state`.
- `Story` — 18 histórias: `title`, `summary[]`, `debate`, `theme`, `region`, `state`, `articles[]`.
- `Article` — `sourceId`, `title`, `excerpt`, `url`, `publishedAt` (ISO), `stance` (`support`/`critical`/`neutral`/`mixed`).

`timeline` e `distribution` são **derivadas**, nunca armazenadas.

## 5. Regra de assimetria

**Lente ideologia** (possui `opposition`): lado A = `left + center-left`, lado B = `center-right + right`, centro ignorado.
Sinalizado quando: `dominantShare >= 55%` **e** `oppositeShare <= 25%` **e** `>= 5` veículos. Severidade `high` se `dominantShare >= 70%`.

**Lentes de concentração** (tipo de veículo, região): sinalizado quando `dominantShare >= 60%` **e** `secondShare <= 20%` **e** `>= 5` veículos. Severidade `high` se `dominantShare >= 80%`.

A regra é exibida na UI — nunca escondida.

## 6. Arquitetura

```
src/
  types/analysis.ts     → tipos do domínio
  data/                 → brand, levels, sources, stories, index
  lib/analysis.ts       → funções puras de análise
  lib/format.ts         → formatação pt-BR
  stores/analysis.ts    → Pinia: lente, filtros, ordenação
  components/analysis/  → componentes apresentacionais
  components/layout/    → cabeçalho
  views/                → AnalysesView, StoryAnalysisView, MethodologyView, NotFoundView
```

**Zero dependências novas.** Gráficos em SVG à mão.

## 7. Estratégia de testes

- `src/lib/__tests__/analysis.spec.ts` — `distribution`, `asymmetry`, `coverageTimeline`, `firstReported`, `groupArticlesByLevel`, `compareSources`.
- `src/data/__tests__/dataset.spec.ts` — integridade do dataset (ids únicos, referências válidas, ratings válidos, datas ISO, ordem crescente).
- `src/stores/__tests__/analysis.spec.ts` — filtros, ordenação, reset.
- Testes de componente — `BiasBar`, `StoryCard`, `TimelineChart`, `CoverageComparison`.
- Testes de view — `StoryAnalysisView` (render e redirect de slug inválido).

## 8. Honestidade do dataset

O dataset é **demonstrativo**: veículos reais com ratings editoriais atribuídos a dedo, mas histórias, títulos e excertos são ilustrativos, e os URLs são de exemplo. A UI declara isso no rodapé e na página de metodologia (`DATASET_KIND = 'demonstrativo'`). O pipeline está desenhado para que a troca por uma API real ocorra apenas no módulo `src/data/`.
