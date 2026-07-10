export interface BackendHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  checks: {
    database: { status: 'connected' | 'disconnected'; latency_ms: number }
    disk: { used_percent: number; total_gb: number; status: 'ok' | 'warning' }
  }
  uptime: string
  timestamp: string
  error?: string
}

export interface ScraperHealth {
  healthy: boolean
  venue_code: string
  last_success_at: string | null
  hours_since_last_success: number | null
  consecutive_failures: number
  ordio_last_success_at: string | null
  last_run: {
    run_id: string
    run_started_at: string
    run_completed_at: string
    orderbird_success: boolean
    ordio_success: null
    errors: string[]
    created_at: string
  } | null
  error?: string
}

export interface ScraperRun {
  run_id: string
  run_started_at: string
  run_completed_at: string
  orderbird_success: boolean
  ordio_success: null
  errors: string[]
  created_at: string
}

export interface OrdioHours {
  pipeline: 'work-hours'
  found: boolean
  last_success_date?: string | null
  last_scrape_date?: string | null
  last_inserted?: number | null
  days_since_success?: number | null
  error?: string
}

export interface AgentState {
  loaded: boolean
  pid: string | null
  running: boolean
  exit_status: number | null
}

export interface StudioHealth {
  chrome_9222_alive: boolean
  chrome_9223_alive: boolean
  agents: {
    'com.oasis.orderbird-scraper': AgentState
    'com.oasis.ordio-chrome-keeper': AgentState
    'com.oasis.ordio-hours-daily': AgentState
  }
  error?: string
}

export type CardStatus = 'up' | 'down' | 'degraded' | 'unknown' | 'loading' | 'error'
