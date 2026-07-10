import { useQuery } from '@tanstack/react-query'
import { apiFetch, relativeTime } from '../lib/api'
import type { ScraperHealth, CardStatus } from '../types'

export function useScraperHealth() {
  return useQuery<ScraperHealth>({
    queryKey: ['scraper-health'],
    queryFn: () => apiFetch('/api/scraper-health'),
  })
}

export function orderbirdStatus(d: ScraperHealth | undefined): {
  status: CardStatus
  lines: string[]
} {
  if (!d) return { status: 'loading', lines: [] }
  if (d.error) return { status: 'error', lines: ['Unreachable'] }

  const lines: string[] = []
  let status: CardStatus

  if (!d.healthy) {
    status = 'down'
  } else if (d.consecutive_failures > 0) {
    status = 'degraded'
  } else {
    status = 'up'
  }

  lines.push(`Last: ${relativeTime(d.last_success_at)}`)
  if (d.hours_since_last_success !== null) {
    lines.push(`Hours since success: ${d.hours_since_last_success.toFixed(1)}h`)
  }
  if (d.consecutive_failures > 0) {
    lines.push(`Failures: ${d.consecutive_failures}`)
  }
  if (d.last_run?.errors?.length) {
    lines.push(`Error: ${d.last_run.errors[0]}`)
  }

  return { status, lines }
}

export function ordioDataStatus(d: ScraperHealth | undefined): {
  status: CardStatus
  lines: string[]
} {
  if (!d) return { status: 'loading', lines: [] }
  if (d.error) return { status: 'error', lines: ['Unreachable'] }

  const lines: string[] = [
    `Last data: ${relativeTime(d.ordio_last_success_at)}`,
    'Revenue pipeline: retired (expected)',
  ]

  // Ordio data is always "unknown" from backend perspective — null is normal
  return { status: 'unknown', lines }
}
