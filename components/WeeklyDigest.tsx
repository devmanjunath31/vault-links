'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Bookmark } from '@/types/bookmark'
import { X, BookOpen, BarChart2 } from 'lucide-react'

interface WeeklyDigestProps {
  bookmarks: Bookmark[]
  onActivateReadingList: () => void
}

function isoWeekKey(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
  return `digest-week-${d.getUTCFullYear()}-${week}`
}

export default function WeeklyDigest({ bookmarks, onActivateReadingList }: WeeklyDigestProps) {
  const [dismissed, setDismissed] = useState(true)
  const weekKey = isoWeekKey()

  useEffect(() => {
    if (localStorage.getItem(weekKey) !== 'dismissed') {
      setDismissed(false)
    }
  }, [weekKey])

  const stats = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const savedLastWeek = bookmarks.filter((b) => new Date(b.created_at).getTime() >= oneWeekAgo).length
    const readLastWeek = bookmarks.filter((b) => b.is_read && new Date(b.created_at).getTime() >= oneWeekAgo).length
    const oldestUnread = bookmarks
      .filter((b) => !b.is_read)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 3)
    return { savedLastWeek, readLastWeek, oldestUnread }
  }, [bookmarks])

  function dismiss() {
    localStorage.setItem(weekKey, 'dismissed')
    setDismissed(true)
  }

  if (dismissed || stats.savedLastWeek === 0) return null

  return (
    <div className="bg-linear-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 border border-indigo-100 dark:border-indigo-900 rounded-2xl px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mt-0.5">
            <BarChart2 size={14} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Weekly digest</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              You saved{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats.savedLastWeek}</span>{' '}
              bookmark{stats.savedLastWeek !== 1 ? 's' : ''} this week
              {stats.readLastWeek > 0 && (
                <>, read{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.readLastWeek}</span>
                </>
              )}.
            </p>
            {stats.oldestUnread.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">Oldest unread:</span>
                {stats.oldestUnread.map((b) => {
                  let domain = ''
                  try { domain = new URL(b.url).hostname.replace(/^www\./, '') } catch { /* noop */ }
                  return (
                    <a
                      key={b.id}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-40"
                    >
                      {domain || b.title}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {stats.oldestUnread.length > 0 && (
            <button
              onClick={() => { onActivateReadingList(); dismiss() }}
              className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <BookOpen size={11} />
              Start reading
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
