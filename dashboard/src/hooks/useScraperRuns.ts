import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { ScraperRun, CardStatus } from '../types'

export function useScraperRuns() {
  const query = useQuery<ScraperRun[]>({
    queryKey: ['scraper-runs'],
    queryFn: () => apiFetch('/api/scraper-runs'),
  })

  const runs = Array.isArray(query.data) ? query.data : []
  let status: CardStatus = 'loading'
  const lines: string[] = []

  if (query.isPending) {
    status = 'loading'
  } else if (query.isError) {
    status = 'error'
    lines.push(query.error instanceof Error ? query.error.message : 'Failed')
  } else if (runs.length === 0) {
    status = 'unknown'
    lines.push('No runs found')
  } else {
    const recent = runs.slice(0, 3)
    const allOk = runs.every(r => r.orderbird_success)
    const recentFail = recent.some(r => !r.orderbird_success)

    status = recentFail ? 'down' : allOk ? 'up' : 'degraded'

    const ok = runs.filter(r => r.orderbird_success).length
    lines.push(`${ok}/${runs.length} runs succeeded`)
    if (runs[0]) {
      const d = new Date(runs[0].created_at)
      lines.push(`Latest: ${d.toLocaleDateString('en-DE')} ${d.toLocaleTimeString('en-DE', { hour: '2-digit', minute: '2-digit' })}`)
    }
  }

  return { query, runs, status, lines }
}
