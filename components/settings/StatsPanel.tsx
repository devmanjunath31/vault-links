'use client'

import { useMemo } from 'react'
import type { Bookmark } from '@/types/bookmark'
import { LayoutGrid, Globe, BookOpen, MousePointerClick, Tag, TrendingUp } from 'lucide-react'

interface StatsPanelProps {
  bookmarks: Bookmark[]
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  Ruby: '#701516', PHP: '#4F5D95', CSS: '#563d7c', Swift: '#ffac45',
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function startOfWeek(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.getFullYear(), d.getMonth(), diff)
}

export default function StatsPanel({ bookmarks }: StatsPanelProps) {
  const now = new Date()
  const weekAgo   = new Date(now.getTime() - 7 * 86400_000)
  const monthAgo  = new Date(now.getTime() - 30 * 86400_000)

  const thisWeek  = useMemo(() => bookmarks.filter(b => new Date(b.created_at) >= weekAgo).length, [bookmarks, weekAgo])
  const thisMonth = useMemo(() => bookmarks.filter(b => new Date(b.created_at) >= monthAgo).length, [bookmarks, monthAgo])
  const readCount = useMemo(() => bookmarks.filter(b => b.is_read).length, [bookmarks])
  const unread    = bookmarks.length - readCount
  const readPct   = bookmarks.length ? Math.round((readCount / bookmarks.length) * 100) : 0

  // Top domains
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    bookmarks.forEach(b => {
      const d = getDomain(b.url)
      if (d) counts[d] = (counts[d] ?? 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [bookmarks])
  const maxDomain = domainCounts[0]?.[1] ?? 1

  // Tag frequency
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    bookmarks.forEach(b => (b.tags ?? []).forEach(t => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [bookmarks])
  const maxTag = tagCounts[0]?.[1] ?? 1

  // Most clicked
  const mostClicked = useMemo(
    () => [...bookmarks].sort((a, b) => b.click_count - a.click_count).filter(b => b.click_count > 0).slice(0, 5),
    [bookmarks]
  )

  // Weekly activity (last 8 weeks)
  const weeklyActivity = useMemo(() => {
    const weeks: { label: string; count: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(new Date(now.getTime() - i * 7 * 86400_000))
      const weekEnd   = new Date(weekStart.getTime() + 7 * 86400_000)
      const count     = bookmarks.filter(b => {
        const d = new Date(b.created_at)
        return d >= weekStart && d < weekEnd
      }).length
      weeks.push({
        label: i === 0 ? 'This week' : `${i}w ago`,
        count,
      })
    }
    return weeks
  }, [bookmarks]) // eslint-disable-line react-hooks/exhaustive-deps
  const maxWeek = Math.max(...weeklyActivity.map(w => w.count), 1)

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Top-level metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total saved',  value: bookmarks.length, Icon: LayoutGrid,       color: 'bg-blue-50 dark:bg-blue-950 text-blue-500' },
          { label: 'This week',    value: thisWeek,          Icon: TrendingUp,       color: 'bg-violet-50 dark:bg-violet-950 text-violet-500' },
          { label: 'This month',   value: thisMonth,         Icon: Globe,            color: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-500' },
          { label: 'Unread',       value: unread,            Icon: BookOpen,         color: 'bg-amber-50 dark:bg-amber-950 text-amber-500' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon size={15} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Top domains */}
      {domainCounts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Globe size={14} className="text-violet-500" /> Top domains
          </p>
          <div className="space-y-3">
            {domainCounts.map(([domain, count]) => (
              <div key={domain} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 dark:text-slate-300 w-36 truncate">{domain}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxDomain) * 100}%`, background: 'var(--accent)' }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reading progress */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <BookOpen size={14} className="text-indigo-500" /> Reading progress
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${readPct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{readPct}%</span>
        </div>
        <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />{readCount} read</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600 inline-block" />{unread} unread</span>
        </div>
      </div>

      {/* Weekly activity */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-blue-500" /> Weekly activity
        </p>
        <div className="flex items-end gap-1.5 h-20">
          {weeklyActivity.map(({ label, count }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${Math.max((count / maxWeek) * 64, count > 0 ? 4 : 0)}px`,
                  background: 'var(--accent)',
                  opacity: count === 0 ? 0.15 : 0.85,
                }}
              />
              {count > 0 && (
                <span className="text-[9px] font-medium" style={{ color: 'var(--accent)' }}>{count}</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1">
          {weeklyActivity.map(({ label }) => (
            <div key={label} className="flex-1 text-center">
              <span className="text-[9px] text-slate-400 truncate">{label.replace(' ago', '')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most visited */}
      {mostClicked.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <MousePointerClick size={14} className="text-emerald-500" /> Most visited
          </p>
          <div className="space-y-3">
            {mostClicked.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-4">{i + 1}</span>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors truncate"
                >
                  {b.title}
                </a>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MousePointerClick size={10} />{b.click_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags cloud */}
      {tagCounts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Tag size={14} className="text-pink-500" /> Tag cloud
          </p>
          <div className="flex flex-wrap gap-2">
            {tagCounts.map(([tag, count]) => {
              const size = 11 + Math.round((count / maxTag) * 6)
              return (
                <span
                  key={tag}
                  className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full font-medium"
                  style={{ fontSize: `${size}px` }}
                >
                  #{tag} <span className="opacity-50">{count}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
