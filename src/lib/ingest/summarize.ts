import { cosine, fold, inverseDocumentFrequency, tfidfVector, tokenize } from './text'

interface Member {
  title: string
  excerpt: string
}

export function splitSentences(value: string): string[] {
  return value
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 25 && sentence.length <= 320)
}

function trimEnd(value: string): string {
  return value.replace(/[\s.!?]+$/, '')
}

export interface StoryText {
  summary: string[]
  debate: string
}

export function buildStoryText(members: Member[], maxSummary = 3): StoryText {
  const candidates: string[] = []
  const seen = new Set<string>()

  for (const member of members) {
    for (const sentence of splitSentences(member.excerpt)) {
      const key = fold(sentence).slice(0, 90)
      if (seen.has(key)) continue
      seen.add(key)
      candidates.push(sentence)
    }
  }

  if (candidates.length === 0) {
    for (const member of members) candidates.push(trimEnd(member.title))
  }

  const documents = candidates.map((sentence) => tokenize(sentence))
  const idf = inverseDocumentFrequency(documents)
  const vectors = documents.map((tokens) => tfidfVector(tokens, idf))

  const ranked = candidates
    .map((sentence, index) => {
      const vector = vectors[index]!
      let weight = 0
      for (const value of vector.values()) weight += value
      return { sentence, index, weight }
    })
    .sort((left, right) => right.weight - left.weight || left.index - right.index)

  const summary: { sentence: string; index: number }[] = []
  for (const candidate of ranked) {
    if (summary.length >= maxSummary) break
    const duplicate = summary.some((chosen) => {
      const left = vectors[chosen.index]!
      const right = vectors[candidate.index]!
      return cosine(left, right) > 0.72
    })
    if (!duplicate) summary.push({ sentence: trimEnd(candidate.sentence), index: candidate.index })
  }

  const ordered = summary.sort((left, right) => left.index - right.index)
  const excluded = new Set(ordered.map((item) => item.index))

  return {
    summary:
      ordered.length > 0
        ? ordered.map((item) => item.sentence)
        : members.slice(0, 1).map((member) => trimEnd(member.title)),
    debate: buildDebate(members, vectors, candidates, excluded),
  }
}

function buildDebate(
  members: Member[],
  vectors: Map<string, number>[],
  candidates: string[],
  excluded: Set<number>,
): string {
  if (members.length === 0) return 'Cobertura insuficiente para identificar o ponto de divergência.'

  const centroid = new Map<string, number>()
  for (const vector of vectors) {
    for (const [token, weight] of vector) {
      centroid.set(token, (centroid.get(token) ?? 0) + weight)
    }
  }
  const norm = Math.sqrt([...centroid.values()].reduce((acc, value) => acc + value * value, 0))
  if (norm > 0) {
    for (const [token, weight] of centroid) centroid.set(token, weight / norm)
  }

  let farthest = -1
  let farthestScore = Number.POSITIVE_INFINITY

  vectors.forEach((vector, index) => {
    if (excluded.has(index)) return
    const score = cosine(vector, centroid)
    if (score < farthestScore) {
      farthestScore = score
      farthest = index
    }
  })

  const chosen = trimEnd(candidates[farthest] ?? members[0]!.title)
  if (!chosen) return 'Cobertura insuficiente para identificar o ponto de divergência.'

  const alreadyQuestion = chosen.endsWith('?')
  return alreadyQuestion ? chosen : `Em disputa: ${chosen}.`
}
