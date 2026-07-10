import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const INTERVAL = 60

export default function Header() {
  const qc = useQueryClient()
  const [remaining, setRemaining] = useState(INTERVAL)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          return INTERVAL
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  function refresh() {
    qc.invalidateQueries()
    setRemaining(INTERVAL)
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <div>
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
          TheBarApp Ops
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">Das Wohnzimmer — Production</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 font-mono">
          Refresh in {remaining}s
        </span>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer px-2.5 py-1.5 rounded-md hover:bg-zinc-800"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>
    </header>
  )
}
