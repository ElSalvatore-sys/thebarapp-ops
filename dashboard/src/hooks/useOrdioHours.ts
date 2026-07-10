import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { OrdioHours, CardStatus } from '../types'

export function useOrdioHours() {
  return useQuery<OrdioHours>({
    queryKey: ['ordio-hours'],
    queryFn: () => apiFetch('/api/ordio-hours'),
    refetchInterval: 60_000,
  })
}

// The LIVE Ordio pipeline is the daily work-hours scraper (com.oasis.ordio-hours-daily),
// whose ground truth is Studio-local run.log — NOT the backend /pp/scraper record, which
// only tracks the retired Ordio *revenue* leg (ordio_success always null there).
export function ordioHoursStatus(d: OrdioHours | undefined): {
  status: CardStatus
  lines: string[]
} {
  if (!d) return { status: 'loading', lines: [] }
  if (d.error) return { status: 'error', lines: [`Log read error: ${d.error}`] }
  if (!d.found || !d.last_success_date) {
    return { status: 'unknown', lines: ['Work-hours pipeline: no run.log found'] }
  }

  const days = d.days_since_success
  let status: CardStatus
  if (days === null || days === undefined) status = 'unknown'
  else if (days <= 1) status = 'up'
  else if (days === 2) status = 'degraded'
  else status = 'down'

  const lines: string[] = [`Last import: ${d.last_success_date}`]
  if (typeof d.last_inserted === 'number') {
    lines.push(`Rows imported: ${d.last_inserted}`)
  }
  if (typeof days === 'number') {
    lines.push(days <= 0 ? 'Ran today' : `${days}d since last import`)
  }
  lines.push('Work-hours pipeline: live (:9223)')

  return { status, lines }
}
