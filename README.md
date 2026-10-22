# GroundBrNews

**Veja os dois lados de cada notícia no Brasil.**

Plataforma de análise de cobertura de notícias, no espírito do [Ground News](https://ground.news),
adaptada ao cenário brasileiro. Para cada história em alta, o GroundBrNews mostra **como a cobertura
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
  data/                 → brand, levels, sources (40 veículos), feeds, stories, index
  data/generated/       → stories.json + manifest.json produzidos pela ingestão
  lib/ingest/           → coleta, parsing, clustering, tema, tom e resumo
  scripts/              → orquestrador da ingestão (Node + rolldown)
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
npm run ingest       # coleta os feeds e regrava src/data/generated/
npm run ingest:dry   # roda sem gravar e imprime as histórias agrupadas
```

Flags úteis da ingestão: `--window=96` (horas), `--threshold=0.32` (similaridade do clustering),
`--stories=70` (máximo), `--source=folha` (um veículo só), `--show=20` (histórias no log).

> O `.npmrc` do projeto define `legacy-peer-deps=true`: o npm 9 acerta um bug do arborist
> (`edgesOut`) ao resolver o grafo de peer dependencies deste stack.

## Sobre os dados

Os dados são **reais**, coletados dos feeds RSS dos veículos e versionados em
`src/data/generated/stories.json` (a coleta é offline: `npm run ingest`). O site é estático — não
há servidor, chave de API nem CORS em tempo de execução.

Como a coleta funciona:

1. baixa os feeds de `src/data/feeds.ts` (25 veículos com RSS/sitemap, com rate-limit por host);
2. normaliza URL, data e título e descarta duplicatas;
3. agrupa artigos por similaridade TF-IDF num DSU com restrições de janela (72 h) e de fontes;
4. escolhe o título medoide, o tema majoritário e a região/estado do veículo que publicou primeiro;
5. gera resumo extrativo (TF-IDF) e a frase de divergência ("O que está em debate");
6. **absorve** o dataset anterior (casando por URL de artigo, preservando `slug` e `id`);
7. descarta histórias cujo artigo mais recente passou de **7 dias**;
8. grava `stories.json` + `manifest.json` (data da coleta, feeds OK, artigos na janela, absorvidas,
   mantidas e expiradas).

Limitações declaradas na metodologia:

- **Cobertura** — 25 dos 40 veículos curados têm feed; a região **Sul** não está representada. A
  maioria das histórias tem 2–4 veículos, então a assimetria é sinalizada só quando há ≥ 5.
- **Retenção** — cada rodada busca as últimas 96 h e mantém as histórias por 7 dias, mesmo que
  saiam da janela de coleta. Depois disso, somem.
- **Ratings editoriais** — ideologia, tipo e região continuam **manuais** (nenhuma fonte pública
  classifica o viés da imprensa brasileira). O join é por domínio.
- **Tom** — estimado por um léxico pt-BR conservador. É um rótulo de *tom do texto* ("Tom:
  positivo/negativo"), não a posição editorial do veículo; o padrão é neutro.
- **Links** — apontam para a matéria original no site do veículo; feeds pagos/instáveis podem
  falhar em uma rodada e voltar na seguinte.

## Atualização automática

O repositório tem dois workflows em `.github/workflows/`:

- **`ingest.yml`** — diariamente às **06:17 BRT** (`17 9 * * *` UTC) roda `npm run ingest`, valida com
  type-check e testes, e commita `src/data/generated/` como `groundbrnews-bot`. Também pode ser
  disparado manualmente em *Actions → ingest → Run workflow*.
- **`ci.yml`** — em push/PR para `main`: type-check, testes e build.

O worker tem dois guardas contra dias ruins: se **menos da metade dos feeds** responder ou se
**nenhuma história** for formada, ele sai com erro e **não sobrescreve** o dataset. Para ignorar,
rode `npm run ingest -- --force`.

Se o Cron do GitHub atrasar ou pular um dia, nada quebra: a próxima rodada ainda encontra as
histórias dentro da retenção de 7 dias.

## Deploy no Cloudflare Pages

Conecte o repositório `pdscience/groundbrnews` em **Workers & Pages → Create → Pages → Connect to
Git** com:

| Campo | Valor |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Variável de ambiente | `NODE_VERSION=22.18.0` |

`public/_redirects` já faz o fallback de SPA (`/* /index.html 200`), necessário porque o router usa
`createWebHistory`. Cada commit diário do bot dispara um novo deploy; se o build falhar, a versão
anterior continua no ar. O plano gratuito cobre folgado 1 deploy/dia.

Para trocar a fonte, basta sobrescrever `src/data/generated/stories.json` — o cálculo, a interface e
os testes são independentes. Ver o [design doc](docs/superpowers/specs/2026-10-22-chao-brasil-design.md)
e o [plano de implementação](docs/superpowers/plans/2026-10-22-chao-brasil.md).
