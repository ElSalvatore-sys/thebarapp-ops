import Header from './components/Header'
import PipelineCard from './components/PipelineCard'
import { useBackendHealth } from './hooks/useBackendHealth'
import { useScraperHealth, orderbirdStatus } from './hooks/useScraperHealth'
import { useScraperRuns } from './hooks/useScraperRuns'
import { useStudioHealth, orderbirdStudioStatus, ordioStudioStatus } from './hooks/useStudioHealth'
import { useOrdioHours, ordioHoursStatus } from './hooks/useOrdioHours'
import type { ScraperRun } from './types'

function RunDots({ runs }: { runs: ScraperRun[] }) {
  if (runs.length === 0) return null
  return (
    <div className="flex gap-1 flex-wrap">
      {runs.map((r, i) => (
        <span
          key={r.run_id ?? i}
          title={`${r.created_at} — ${r.orderbird_success ? 'OK' : 'FAIL'}`}
          className={`w-3 h-3 rounded-sm ${r.orderbird_success ? 'bg-green-500/70' : 'bg-red-500/80'}`}
        />
      ))}
    </div>
  )
}

export default function App() {
  const backendHealth = useBackendHealth()
  const scraperQuery = useScraperHealth()
  const runsData = useScraperRuns()
  const studioQuery = useStudioHealth()
  const ordioHoursQuery = useOrdioHours()

  const scraperData = scraperQuery.data
  const studioData = studioQuery.data

  const { status: scraperStatus, lines: scraperLines } = orderbirdStatus(scraperData)
  const { status: ordioHoursSt, lines: ordioHoursLines } = ordioHoursStatus(ordioHoursQuery.data)
  const { status: obStudioSt, lines: obStudioLines } = orderbirdStudioStatus(studioData)
  const { status: ordioStudioSt, lines: ordioStudioLines } = ordioStudioStatus(studioData)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Card 1: Backend API */}
          <PipelineCard
            title="Backend API"
            status={backendHealth.status}
            lines={backendHealth.lines}
          />

          {/* Card 2: Orderbird Scraper (Hetzner data) */}
          <PipelineCard
            title="Orderbird Scraper"
            status={scraperQuery.isPending ? 'loading' : scraperStatus}
            lines={scraperLines}
          />

          {/* Card 3: Ordio Work-Hours (LIVE — Studio-local run.log, ordio-hours-daily) */}
          <PipelineCard
            title="Ordio Work-Hours"
            status={ordioHoursQuery.isPending ? 'loading' : ordioHoursSt}
            lines={ordioHoursLines}
          />

          {/* Card 4: Orderbird Studio (Chrome :9222 + LaunchAgent) */}
          <PipelineCard
            title="Studio: Orderbird"
            status={studioQuery.isPending ? 'loading' : obStudioSt}
            lines={obStudioLines}
          />

          {/* Card 5: Ordio Studio (Chrome :9223 + ordio LaunchAgents) */}
          <PipelineCard
            title="Studio: Ordio"
            status={studioQuery.isPending ? 'loading' : ordioStudioSt}
            lines={ordioStudioLines}
          />

          {/* Card 6: Scraper Run History */}
          <PipelineCard
            title="Scraper History"
            status={runsData.status}
            lines={runsData.lines}
            extra={<RunDots runs={runsData.runs} />}
          />

        </div>
      </main>
    </div>
  )
}
