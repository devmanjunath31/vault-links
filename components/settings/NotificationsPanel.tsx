'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/profile'
import type { Bookmark } from '@/types/bookmark'
import { ShieldCheck, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface NotificationsPanelProps {
  profile: Profile
  bookmarks: Bookmark[]
  userId: string
}

interface CheckResult { id: string; is_dead: boolean }

export default function NotificationsPanel({ profile, bookmarks, userId }: NotificationsPanelProps) {
  const [notifyDeadLinks, setNotifyDeadLinks] = useState(profile.notify_dead_links)
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<CheckResult[] | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleToggle() {
    const next = !notifyDeadLinks
    setNotifyDeadLinks(next)
    await supabase.from('profiles').update({ notify_dead_links: next }).eq('id', userId)
  }

  async function handleCheckNow() {
    setIsChecking(true)
    setResults(null)
    setCheckError(null)

    try {
      const res = await fetch('/api/dead-link-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarkIds: bookmarks.map(b => b.id) }),
      })
      const data = await res.json() as { results: CheckResult[] }
      setResults(data.results)
    } catch {
      setCheckError('Check failed. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const deadCount  = results?.filter(r => r.is_dead).length ?? 0
  const aliveCount = results ? results.length - deadCount : 0

  return (
    <div className="space-y-6 max-w-lg">
      {/* Dead link toggle */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={17} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Dead link notifications</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">
                Get alerted when bookmarked pages are no longer reachable (404, timeout, etc.)
              </p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            role="switch"
            aria-checked={notifyDeadLinks}
            onClick={handleToggle}
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
              notifyDeadLinks ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${notifyDeadLinks ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* On-demand checker */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Check links now</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Scans all {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} for broken links. This may take a moment.
        </p>

        <button
          onClick={handleCheckNow}
          disabled={isChecking || bookmarks.length === 0}
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          {isChecking ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          {isChecking ? 'Checking…' : 'Run check'}
        </button>

        {checkError && (
          <p className="text-xs text-red-500 mt-3 flex items-center gap-1.5">
            <AlertCircle size={12} /> {checkError}
          </p>
        )}

        {results && (
          <div className="mt-4 space-y-3">
            {/* Summary */}
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle size={14} /> {aliveCount} alive
              </span>
              {deadCount > 0 && (
                <span className="flex items-center gap-1.5 text-red-500 font-medium">
                  <XCircle size={14} /> {deadCount} dead
                </span>
              )}
            </div>

            {/* Dead links list */}
            {deadCount > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {results
                  .filter(r => r.is_dead)
                  .map(({ id }) => {
                    const bm = bookmarks.find(b => b.id === id)
                    return bm ? (
                      <div key={id} className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                        <XCircle size={11} className="shrink-0" />
                        <span className="truncate">{bm.title}</span>
                        <span className="text-red-400 font-mono truncate ml-auto">{bm.url.slice(0, 40)}…</span>
                      </div>
                    ) : null
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
