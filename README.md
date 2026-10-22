# Chão Brasil

**Veja os dois lados de cada notícia no Brasil.**

Plataforma de análise de cobertura de notícias, no espírito do [Ground News](https://ground.news),
adaptada ao cenário brasileiro. Para cada história em alta, o Chão Brasil mostra **como a cobertura
se distribuiu entre os veículos** — em três lentes alternáveis — e sinaliza histórias cobertas de
forma desproporcional por um dos lados.

## O que a página entrega

- **Hub de análises** (`/analises`) com filtros por tema, confiabilidade, ordenação e busca.
- **Detalhe por história** (`/analises/:slug`) com:
  - barra de distribuição da cobertura na lente ativa;
  - selo de **assimetria de cobertura**, com os números usados no cálculo visíveis;
  - resumo da história e o **que está em debate**;
  - **evolução temporal** da cobertura (gráfico SVG);
  - lista de artigos agrupada por nível, com tom, horário e score de confiabilidade do veículo;
  - **comparação lado a lado** entre dois veículos;
  - grade dos veículos que publicaram;
  - indicação de **quem noticiou primeiro**.
- **Metodologia** (`/metodologia`) explicando as lentes, a fórmula da assimetria e a proveniência dos dados.

## As três lentes

| Lente | Níveis |
|---|---|
| Ideologia | Esquerda · Centro-esquerda · Centro · Centro-direita · Direita |
| Tipo de veículo | Portal generalista · Jornal impresso · TV e streaming · Rádio e podcast · Portal de nicho · Imprensa alternativa |
| Região | Sudeste · Sul · Nordeste · Norte · Centro-Oeste |

Cada veículo tem **um rating em cada lente**. Trocar de lente troca o campo lido — nada é
recalculado.

## Arquitetura

Domínio-first: todo o cálculo vive em funções puras, testadas; a UI é apresentacional.

```
src/
  types/analysis.ts     → tipos do domínio e uniões literais das 3 lentes
  data/                 → brand, levels, sources (40 veículos), stories (18 histórias), index
  lib/analysis.ts       → distribution, asymmetry, coverageTimeline, firstReported, compareSources…
  lib/format.ts         → formatação pt-BR (percentual, data, tempo relativo)
  stores/analysis.ts    → Pinia: lente ativa, filtros, ordenação
  components/analysis/  → LensSwitcher, BiasBar, StoryCard, TimelineChart, CoverageComparison…
  components/layout/    → AppHeader, AppFooter
  views/                → AnalysesView, StoryAnalysisView, MethodologyView, NotFoundView
```

**Zero dependências novas** — os gráficos são SVG desenhados à mão, sem biblioteca de charts.

### Regra de assimetria

- **Lente ideologia** (oposta): lado A = Esquerda + Centro-esquerda, lado B = Centro-direita +
  Direita; o centro não conta para nenhum lado. Sinalizado quando um lado tem **≥ 55%** da
  cobertura e o outro **≤ 30%**, com **≥ 5 veículos**. Severidade alta a partir de **80%**.
- **Lentes de concentração** (tipo de veículo, região): sinalizado quando uma categoria tem
  **≥ 60%** e a segunda tem **≤ 20%**, com **≥ 5 veículos**. Severidade alta a partir de **80%**.

## Rodando

```sh
npm install
npm run dev          # servidor de desenvolvimento
npm run test:unit    # Vitest em modo watch (use -- --run para uma execução única)
npm run type-check   # vue-tsc
npm run build        # type-check + build de produção
```

> O `.npmrc` do projeto define `legacy-peer-deps=true`: o npm 9 acerta um bug do arborist
> (`edgesOut`) ao resolver o grafo de peer dependencies deste stack.

## Sobre os dados

O dataset é **demonstrativo**. Os veículos e seus ratings editoriais são reais e foram atribuídos a
dedo segundo as linhas editoriais de cada outlet; as histórias, títulos e excertos são ilustrativos
e os links apontam para URLs de exemplo. Isso é declarado no rodapé e na página de metodologia.

A arquitetura foi desenhada para que a troca por dados reais aconteça **apenas na camada de dados**
(`src/data/`) — o cálculo, a interface e os testes permanecem iguais. Ver o
[design doc](docs/superpowers/specs/2026-10-22-chao-brasil-design.md) e o
[plano de implementação](docs/superpowers/plans/2026-10-22-chao-brasil.md).
