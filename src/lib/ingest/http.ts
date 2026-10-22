export const USER_AGENT =
  'ChaoBrasil/1.0 (agregador de cobertura jornalistica; +https://chao.brasil)'

export interface FetchOptions {
  timeoutMs?: number
  retries?: number
  minIntervalMs?: number
  headers?: Record<string, string>
}

export interface FetchTextResult {
  url: string
  status: number
  body: string
}

const lastHit = new Map<string, number>()
const queues = new Map<string, Promise<void>>()

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

async function acquireSlot(host: string, minIntervalMs: number): Promise<void> {
  const previous = queues.get(host) ?? Promise.resolve()
  let release: () => void = () => {}
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  queues.set(
    host,
    previous.then(() => current),
  )
  await previous

  const since = Date.now() - (lastHit.get(host) ?? 0)
  if (since < minIntervalMs) await sleep(minIntervalMs - since)
  lastHit.set(host, Date.now())
  release()
}

export interface FetchBytesResult {
  url: string
  status: number
  bytes: Uint8Array
  contentType: string | null
}

export function decodeBody(bytes: Uint8Array, contentType: string | null): string {
  const headerCharset = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1]
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 400))
  const xmlCharset = /<\?xml[^>]*encoding=["']([\w-]+)["']/i.exec(head)?.[1]
  const declared = (headerCharset ?? xmlCharset ?? 'utf-8').toLowerCase()

  const countBroken = (value: string): number => (value.match(/\uFFFD/g) ?? []).length

  if (declared !== 'utf-8' && declared !== 'utf8') {
    try {
      const text = new TextDecoder(declared).decode(bytes)
      if (countBroken(text) === 0) return text
    } catch {
      return new TextDecoder('windows-1252').decode(bytes)
    }
  }

  const utf8 = new TextDecoder('utf-8').decode(bytes)
  if (countBroken(utf8) === 0) return utf8

  const latin = new TextDecoder('windows-1252').decode(bytes)
  return countBroken(latin) < countBroken(utf8) ? latin : utf8
}

export async function fetchBytes(
  url: string,
  options: FetchOptions = {},
): Promise<FetchBytesResult> {
  const { timeoutMs = 12_000, retries = 2, minIntervalMs = 400, headers = {} } = options
  const host = hostOf(url)
  const attempts = retries + 1
  let lastError: unknown = new Error(`falha ao buscar ${url}`)

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await acquireSlot(host, minIntervalMs)

    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': USER_AGENT,
          accept:
            'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5',
          'accept-language': 'pt-BR,pt;q=0.9',
          ...headers,
        },
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (response.ok) {
        return {
          url: response.url || url,
          status: response.status,
          bytes: new Uint8Array(await response.arrayBuffer()),
          contentType: response.headers.get('content-type'),
        }
      }

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`)
        const retryAfter = Number(response.headers.get('retry-after'))
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(60_000, retryAfter * 1_000)
          : Math.min(60_000, 3_000 * 2 ** (attempt - 1))
        await sleep(backoff)
        continue
      }

      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
      if (attempt < attempts) await sleep(1_200 * attempt)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<FetchTextResult> {
  const result = await fetchBytes(url, options)
  return {
    url: result.url,
    status: result.status,
    body: decodeBody(result.bytes, result.contentType),
  }
}

export interface FetchJsonOptions extends FetchOptions {
  accept?: string
}

export async function fetchJson<T = unknown>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { accept = 'application/json', headers = {}, ...rest } = options
  const result = await fetchText(url, {
    ...rest,
    headers: { accept, ...headers },
  })
  return JSON.parse(result.body) as T
}
