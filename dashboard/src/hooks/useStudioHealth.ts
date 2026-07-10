import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { StudioHealth, AgentState, CardStatus } from '../types'

export function useStudioHealth() {
  return useQuery<StudioHealth>({
    queryKey: ['studio-health'],
    queryFn: () => apiFetch('/api/studio'),
    refetchInterval: 60_000,
  })
}

function agentLabel(label: string): string {
  return label.replace('com.oasis.', '')
}

function agentLine(label: string, state: AgentState): string {
  const short = agentLabel(label)
  if (!state.loaded) return `${short}: not loaded`
  if (state.running) return `${short}: running (pid ${state.pid})`
  return `${short}: loaded, not running (exit ${state.exit_status ?? '?'})`
}

export function orderbirdStudioStatus(d: StudioHealth | undefined): {
  status: CardStatus
  lines: string[]
} {
  if (!d) return { status: 'loading', lines: [] }
  if (d.error) return { status: 'error', lines: [d.error] }

  const agent = d.agents?.['com.oasis.orderbird-scraper']
  const chromeOk = d.chrome_9222_alive
  const lines: string[] = [
    `Chrome :9222 — ${chromeOk ? 'alive' : 'DEAD'}`,
    agentLine('com.oasis.orderbird-scraper', agent),
  ]

  let status: CardStatus
  if (!chromeOk) {
    status = 'down'
  } else if (!agent?.running) {
    status = 'degraded'
  } else {
    status = 'up'
  }

  return { status, lines }
}

export function ordioStudioStatus(d: StudioHealth | undefined): {
  status: CardStatus
  lines: string[]
} {
  if (!d) return { status: 'loading', lines: [] }
  if (d.error) return { status: 'error', lines: [d.error] }

  const keeper = d.agents?.['com.oasis.ordio-chrome-keeper']
  const daily = d.agents?.['com.oasis.ordio-hours-daily']
  const chromeOk = d.chrome_9223_alive

  const lines: string[] = [
    `Chrome :9223 — ${chromeOk ? 'alive' : 'DEAD'}`,
    agentLine('com.oasis.ordio-chrome-keeper', keeper),
    agentLine('com.oasis.ordio-hours-daily', daily),
  ]

  let status: CardStatus
  if (!chromeOk) {
    status = 'down'
  } else if (!keeper?.running && !daily?.running) {
    status = 'degraded'
  } else {
    status = 'up'
  }

  return { status, lines }
}
