const TOKEN = import.meta.env.VITE_BRIDGE_TOKEN ?? ''

export const apiHeaders: HeadersInit = TOKEN
  ? { 'X-Bridge-Token': TOKEN }
  : {}

export async function apiFetch<T>(path: string): Promise<T> {
  const resp = await fetch(path, { headers: apiHeaders })
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)
  return resp.json() as Promise<T>
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  const diffSec = (Date.now() - new Date(iso).getTime()) / 1000
  if (diffSec < 0) return 'Just now'
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}
