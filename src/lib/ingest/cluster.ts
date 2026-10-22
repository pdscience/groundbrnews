import { cosine, inverseDocumentFrequency, tfidfVector, tokenize } from './text'

export interface ClusterItem {
  id: string
  sourceId: string
  title: string
  excerpt: string
  publishedAt: string
}

export interface ClusterOptions {
  maxHoursApart?: number
  maxSpanHours?: number
  threshold?: number
  maxClusterSize?: number
  minSources?: number
}

export interface PairScore {
  a: string
  b: string
  score: number
}

export interface ClusterResult {
  groups: string[][]
  pairsEvaluated: number
  pairsKept: number
}

const HOUR = 3_600_000

interface Entry {
  item: ClusterItem
  tokenSet: Set<string>
  vector: Map<string, number>
  time: number
}

class DisjointSet {
  private parent: number[]
  private size: number[]
  private minTime: number[]
  private maxTime: number[]

  constructor(count: number, times: number[]) {
    this.parent = Array.from({ length: count }, (_, index) => index)
    this.size = Array.from({ length: count }, () => 1)
    this.minTime = [...times]
    this.maxTime = [...times]
  }

  find(index: number): number {
    let root = index
    while (this.parent[root] !== root) root = this.parent[root]!
    while (this.parent[index] !== root) {
      const next = this.parent[index]!
      this.parent[index] = root
      index = next
    }
    return root
  }

  canMerge(a: number, b: number, maxSize: number, maxSpan: number): boolean {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA === rootB) return true;
    if (this.size[rootA]! + this.size[rootB]! > maxSize) return false
    const min = Math.min(this.minTime[rootA]!, this.minTime[rootB]!)
    const max = Math.max(this.maxTime[rootA]!, this.maxTime[rootB]!)
    return max - min <= maxSpan
  }

  union(a: number, b: number): void {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA === rootB) return
    const target = this.size[rootA]! >= this.size[rootB]! ? rootA : rootB
    const source = target === rootA ? rootB : rootA
    this.parent[source] = target
    this.size[target] = this.size[target]! + this.size[source]!
    this.minTime[target] = Math.min(this.minTime[target]!, this.minTime[source]!)
    this.maxTime[target] = Math.max(this.maxTime[target]!, this.maxTime[source]!)
  }
}

export function clusterItems(items: ClusterItem[], options: ClusterOptions = {}): ClusterResult {
  const {
    maxHoursApart = 48,
    maxSpanHours = 72,
    threshold = 0.42,
    maxClusterSize = 16,
    minSources = 2,
  } = options

  const usable = items.filter((item) => Number.isFinite(Date.parse(item.publishedAt)))
  if (usable.length < 2) return { groups: [], pairsEvaluated: 0, pairsKept: 0 }

  const documents = usable.map((item) => tokenize(`${item.title} ${item.excerpt}`))
  const idf = inverseDocumentFrequency(documents)

  const entries: Entry[] = usable.map((item, index) => {
    const titleTokens = tokenize(item.title)
    const tokens = documents[index] ?? []
    return {
      item,
      tokenSet: new Set(tokens),
      vector: tfidfVector(tokens, idf, titleTokens),
      time: Date.parse(item.publishedAt),
    }
  })

  const inverted = new Map<string, number[]>()
  entries.forEach((entry, index) => {
    for (const token of entry.tokenSet) {
      const list = inverted.get(token) ?? []
      list.push(index)
      inverted.set(token, list)
    }
  })

  const maxDocumentFrequency = Math.max(2, Math.floor(entries.length * 0.5))
  const shared = new Map<string, number>()

  entries.forEach((entry, index) => {
    const local = new Map<number, number>()
    for (const token of entry.tokenSet) {
      const list = inverted.get(token)
      if (!list || list.length > maxDocumentFrequency) continue
      for (const other of list) {
        if (other === index) continue
        local.set(other, (local.get(other) ?? 0) + 1)
      }
    }
    for (const [other, count] of local) {
      if (other < index || count < 2) continue
      const key = `${index}:${other}`
      shared.set(key, count)
    }
  })

  const maxApart = maxHoursApart * HOUR
  const scored: PairScore[] = []
  let pairsEvaluated = 0

  for (const [key, count] of shared) {
    const [left, right] = key.split(':').map(Number) as [number, number]
    const a = entries[left]!
    const b = entries[right]!
    if (a.item.sourceId === b.item.sourceId) continue
    if (Math.abs(a.time - b.time) > maxApart) continue
    pairsEvaluated += 1
    if (count < 2) continue
    const score = cosine(a.vector, b.vector)
    if (score < threshold) continue
    scored.push({ a: a.item.id, b: b.item.id, score })
  }

  scored.sort((left, right) => right.score - left.score)

  const indexById = new Map(entries.map((entry, index) => [entry.item.id, index]))
  const dsu = new DisjointSet(
    entries.length,
    entries.map((entry) => entry.time),
  )

  for (const pair of scored) {
    const left = indexById.get(pair.a)
    const right = indexById.get(pair.b)
    if (left === undefined || right === undefined) continue
    if (!dsu.canMerge(left, right, maxClusterSize, maxSpanHours * HOUR)) continue
    dsu.union(left, right)
  }

  const buckets = new Map<number, string[]>()
  entries.forEach((entry, index) => {
    const root = dsu.find(index)
    const list = buckets.get(root) ?? []
    list.push(entry.item.id)
    buckets.set(root, list)
  })

  const byId = new Map(entries.map((entry) => [entry.item.id, entry.item]))
  const groups: string[][] = []

  for (const ids of buckets.values()) {
    if (ids.length < 2) continue
    const sourceIds = new Set(ids.map((id) => byId.get(id)!.sourceId))
    if (sourceIds.size < minSources) continue
    const ordered = [...ids].sort(
      (left, right) =>
        Date.parse(byId.get(left)!.publishedAt) - Date.parse(byId.get(right)!.publishedAt),
    )
    groups.push(ordered)
  }

  groups.sort((left, right) => right.length - left.length)
  return { groups, pairsEvaluated, pairsKept: scored.length }
}
