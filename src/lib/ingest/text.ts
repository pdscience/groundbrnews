export const STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'aos', 'as', 'ao', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo', 'ate', 'apos',
  'com', 'como', 'contra', 'cuja', 'cujo', 'da', 'das', 'de', 'dela', 'delas', 'dele', 'deles',
  'depois', 'desde', 'do', 'dos', 'e', 'ela', 'elas', 'ele', 'eles', 'em', 'entre', 'era',
  'eram', 'essa', 'essas', 'esse', 'esses', 'esta', 'estas', 'este', 'estes', 'eu', 'foi',
  'foram', 'ha', 'havia', 'isso', 'isto', 'ja', 'lhe', 'lhes', 'mais', 'mas', 'me', 'mesma',
  'mesmas', 'mesmo', 'mesmos', 'meu', 'minha', 'muito', 'muita', 'muitas', 'muitos', 'na',
  'nas', 'nem', 'no', 'nos', 'nossa', 'nosso', 'num', 'numa', 'o', 'os', 'ou', 'para', 'pela',
  'pelas', 'pelo', 'pelos', 'por', 'pra', 'qual', 'quais', 'que', 'quem', 'se', 'sem', 'seu',
  'seus', 'so', 'sob', 'sobre', 'sua', 'suas', 'tao', 'tem', 'tem', 'ter', 'teu', 'tua', 'um',
  'uma', 'umas', 'uns', 'voce', 'voces', 'ate', 'ainda', 'agora', 'ali', 'aqui', 'assim',
  'bem', 'cada', 'caso', 'conforme', 'contudo', 'durante', 'embora', 'enquanto', 'entao',
  'entretanto', 'hoje', 'ontem', 'amanha', 'porem', 'porque', 'pois', 'quando', 'quanto',
  'segundo', 'todavia', 'todos', 'todas', 'todo', 'toda', 'tambem', 'apenas', 'la', 'acima',
  'abaixo', 'apos', 'ate', 'atraves', 'contra', 'desde', 'perante', 'sem', 'sob', 'sobre',
  'deve', 'devem', 'pode', 'podem', 'vai', 'vao', 'ser', 'sao', 'esta', 'estao', 'estava',
  'estavam', 'era', 'eram', 'foi', 'foram', 'sera', 'serao', 'tem', 'tinha', 'tinham', 'ter',
  'houve', 'ha', 'havia', 'faz', 'fez', 'diz', 'disse', 'afirma', 'afirmou', 'declara',
  'declarou', 'defende', 'defendeu', 'critica', 'criticou', 'aponta', 'apontou', 'revela',
  'revelou', 'mostra', 'mostrou', 'anuncia', 'anunciou', 'confirma', 'confirmou',
  'veja', 'saiba', 'entenda', 'assista', 'ouca', 'leia', 'confira', 'video', 'videos', 'foto',
  'fotos', 'galeria', 'vivo', 'exclusivo', 'analise', 'opiniao', 'editorial', 'coluna',
  'podcast', 'entrevista', 'urgente', 'ultimas', 'ultima', 'noticias', 'noticia', 'detalhes',
  'bomba', 'nova', 'novo', 'novas', 'novos', 'dia', 'dias', 'ano', 'anos', 'mes', 'meses',
  'semana', 'semanas', 'hora', 'horas', 'minuto', 'minutos', 'parte', 'vezes', 'vez',
])

export function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function tokenize(value: string): string[] {
  return fold(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length >= 3 && !/^\d+$/.test(token) && !STOPWORDS.has(token))
}

export function tokenSet(tokens: string[]): Set<string> {
  return new Set(tokens)
}

export function termFrequency(tokens: string[]): Map<string, number> {
  const frequencies = new Map<string, number>()
  for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1)
  return frequencies
}

export function inverseDocumentFrequency(documents: string[][]): Map<string, number> {
  const documentFrequency = new Map<string, number>()
  for (const tokens of documents) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1)
    }
  }

  const total = documents.length
  const idf = new Map<string, number>()
  for (const [token, df] of documentFrequency) {
    idf.set(token, Math.log((total + 1) / (df + 1)) + 1)
  }
  return idf
}

export function tfidfVector(
  tokens: string[],
  idf: Map<string, number>,
  titleTokens: string[] = [],
): Map<string, number> {
  const weights = new Map<string, number>()
  const add = (token: string, amount: number): void => {
    weights.set(token, (weights.get(token) ?? 0) + amount)
  }

  for (const [token, count] of termFrequency(tokens)) {
    add(token, (1 + Math.log(count)) * (idf.get(token) ?? 1))
  }
  for (const token of titleTokens) {
    add(token, 2 * (idf.get(token) ?? 1))
  }

  let norm = 0
  for (const weight of weights.values()) norm += weight * weight
  norm = Math.sqrt(norm)
  if (norm === 0) return weights

  for (const [token, weight] of weights) weights.set(token, weight / norm)
  return weights
}

export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  let dot = 0
  for (const [token, weight] of small) {
    const other = large.get(token)
    if (other !== undefined) dot += weight * other
  }
  return dot
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  let intersection = 0
  for (const token of small) if (large.has(token)) intersection += 1
  return intersection / (a.size + b.size - intersection)
}
