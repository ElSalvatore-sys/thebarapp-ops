import { clsx } from 'clsx'
import type { CardStatus } from '../types'

interface Props {
  status: CardStatus
}

const CONFIG: Record<CardStatus, { label: string; dot: string; text: string; pulse: boolean }> = {
  up:       { label: 'UP',       dot: 'bg-green-500',  text: 'text-green-500',  pulse: true  },
  down:     { label: 'DOWN',     dot: 'bg-red-500',    text: 'text-red-500',    pulse: true  },
  degraded: { label: 'DEGRADED', dot: 'bg-amber-400',  text: 'text-amber-400',  pulse: false },
  unknown:  { label: 'UNKNOWN',  dot: 'bg-zinc-500',   text: 'text-zinc-400',   pulse: false },
  loading:  { label: '...',      dot: 'bg-zinc-600',   text: 'text-zinc-500',   pulse: false },
  error:    { label: 'ERROR',    dot: 'bg-red-700',    text: 'text-red-400',    pulse: false },
}

export default function StatusBadge({ status }: Props) {
  const c = CONFIG[status]
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {c.pulse && (
          <span
            className={clsx(
              'absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping-slow',
              c.dot,
            )}
          />
        )}
        <span className={clsx('relative inline-flex h-2.5 w-2.5 rounded-full', c.dot)} />
      </span>
      <span className={clsx('text-xs font-mono font-medium tracking-widest', c.text)}>
        {c.label}
      </span>
    </span>
  )
}
