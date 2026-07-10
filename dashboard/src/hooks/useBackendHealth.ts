import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { BackendHealth, CardStatus } from '../types'

export function useBackendHealth() {
  const query = useQuery<BackendHealth>({
    queryKey: ['backend-health'],
    queryFn: () => apiFetch('/api/backend-health'),
  })

  const d = query.data
  let status: CardStatus = 'loading'
  const lines: string[] = []

  if (query.isPending) {
    status = 'loading'
  } else if (query.isError || d?.error) {
    status = 'error'
    lines.push('Unreachable')
  } else if (d) {
    const dbOk = d.checks?.database?.status === 'connected'
    const disk = d.checks?.disk?.used_percent ?? 0
    if (!dbOk) {
      status = 'down'
    } else if (disk >= 85) {
      status = 'degraded'
    } else {
      status = 'up'
    }
    if (d.checks?.database) {
      lines.push(`DB: ${d.checks.database.status} · ${d.checks.database.latency_ms}ms`)
    }
    if (d.checks?.disk) {
      lines.push(`Disk: ${d.checks.disk.used_percent}% used`)
    }
    if (d.uptime) {
      lines.push(`Up: ${d.uptime}`)
    }
  }

  return { query, status, lines }
}
