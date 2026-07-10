import { clsx } from 'clsx'
import StatusBadge from './StatusBadge'
import type { CardStatus } from '../types'

interface Props {
  title: string
  status: CardStatus
  lines: string[]
  extra?: React.ReactNode
}

const BORDER: Record<CardStatus, string> = {
  up:       'border-zinc-800 hover:border-zinc-700',
  down:     'border-red-900/60 hover:border-red-800',
  degraded: 'border-amber-900/50 hover:border-amber-800',
  unknown:  'border-zinc-800 hover:border-zinc-700',
  loading:  'border-zinc-800',
  error:    'border-red-900/60',
}

export default function PipelineCard({ title, status, lines, extra }: Props) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-zinc-900 border p-5 flex flex-col gap-3 transition-colors duration-150',
        BORDER[status],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-200 truncate">{title}</h2>
        <StatusBadge status={status} />
      </div>

      {lines.length > 0 && (
        <ul className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <li key={i} className="text-xs text-zinc-400 font-mono leading-relaxed truncate">
              {line}
            </li>
          ))}
        </ul>
      )}

      {extra}
    </div>
  )
}
