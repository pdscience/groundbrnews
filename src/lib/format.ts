const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso)).replace('.', '')
}

export function formatRelativeTime(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours <= 0) return 'agora'
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  return `há ${days} d`
}

export function formatBucketLabel(bucket: string, granularity: 'hour' | 'day'): string {
  const [dayPart, hourPart] = bucket.split('T')
  const parts = (dayPart ?? '').split('-')
  const month = Number(parts[1])
  const day = parts[2]
  const base = `${day ?? ''} ${MONTHS[month - 1] ?? ''}`
  return granularity === 'hour' ? `${base}, ${hourPart ?? '00'}h` : base
}
