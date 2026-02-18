'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark, GitHubMeta } from '@/types/bookmark'
import { Star, GitFork, Circle } from 'lucide-react'

interface GitHubMetaProps {
  bookmark: Bookmark
  onUpdate: (id: string, patch: Partial<Bookmark>) => void
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  Ruby: '#701516', PHP: '#4F5D95', CSS: '#563d7c', Swift: '#ffac45',
  Kotlin: '#A97BFF', Dart: '#00B4AB', Scala: '#c22d40',
}

function parseGitHubRepo(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url)
    if (hostname !== 'github.com') return null
    const parts = pathname.replace(/^\//, '').split('/')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0]}/${parts[1]}`
    }
  } catch { /* noop */ }
  return null
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default function GitHubMetaDisplay({ bookmark, onUpdate }: GitHubMetaProps) {
  const [meta, setMeta] = useState<GitHubMeta | null>(bookmark.github_meta)
  const [loading, setLoading] = useState(false)
  const repo = parseGitHubRepo(bookmark.url)

  useEffect(() => {
    if (!repo || meta) return
    setLoading(true)

    fetch(`/api/github-meta?repo=${encodeURIComponent(repo)}`)
      .then((r) => r.json() as Promise<GitHubMeta | null>)
      .then((data) => {
        if (!data) return
        setMeta(data)
        // Cache in DB so we don't fetch again on next render
        const supabase = createClient()
        supabase.from('bookmarks').update({ github_meta: data }).eq('id', bookmark.id)
        onUpdate(bookmark.id, { github_meta: data })
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setLoading(false))
  }, [repo]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!repo) return null
  if (loading) return (
    <div className="flex gap-3 mt-2">
      {[32, 24, 40].map(w => (
        <div key={w} className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" style={{ width: w }} />
      ))}
    </div>
  )
  if (!meta) return null

  const langColor = meta.language ? (LANG_COLORS[meta.language] ?? '#94a3b8') : null

  return (
    <div className="flex items-center flex-wrap gap-3 mt-1.5">
      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Star size={11} className="text-amber-400" />
        {fmt(meta.stars)}
      </span>
      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <GitFork size={11} />
        {fmt(meta.forks)}
      </span>
      {langColor && (
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Circle size={9} fill={langColor} strokeWidth={0} />
          {meta.language}
        </span>
      )}
    </div>
  )
}
