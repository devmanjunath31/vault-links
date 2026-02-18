'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Collection } from '@/types/collection'
import type { Bookmark } from '@/types/bookmark'
import {
  Plus, Trash2, Folder, BookOpen, Inbox, Settings, LogOut, Loader2,
  LayoutGrid, TrendingUp,
} from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface CollectionsSidebarProps {
  collections: Collection[]
  bookmarks: Bookmark[]
  activeCollectionId: string | null
  onSelect: (id: string | null) => void
}

export default function CollectionsSidebar({
  collections,
  bookmarks,
  activeCollectionId,
  onSelect,
}: CollectionsSidebarProps) {
  const [localCollections, setLocalCollections] = useState<Collection[]>(collections)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Stats
  const stats = useMemo(() => {
    const total = bookmarks.length
    const readCount = bookmarks.filter((b) => b.is_read).length
    const readPct = total ? Math.round((readCount / total) * 100) : 0
    const weekAgo = Date.now() - 7 * 86_400_000
    const thisWeek = bookmarks.filter((b) => new Date(b.created_at).getTime() >= weekAgo).length
    const pinned = bookmarks.filter((b) => b.is_pinned).length
    return { total, readCount, readPct, unread: total - readCount, thisWeek, pinned }
  }, [bookmarks])

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSaving(false); return }

    const { data, error } = await supabase
      .from('collections')
      .insert({ name, color: newColor, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setLocalCollections((prev) => [...prev, data as Collection])
    }
    setNewName('')
    setNewColor(PRESET_COLORS[0])
    setIsAdding(false)
    setIsSaving(false)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setLocalCollections((prev) => prev.filter((c) => c.id !== id))
    if (activeCollectionId === id) onSelect(null)
    await supabase.from('collections').delete().eq('id', id)
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItem = (
    id: string | null,
    label: string,
    Icon: React.ElementType,
    color?: string
  ) => {
    const active = activeCollectionId === id
    return (
      <button
        key={id ?? 'all'}
        onClick={() => onSelect(id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group/item ${
          active
            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Icon size={14} className="shrink-0" style={color ? { color } : undefined} />
        <span className="truncate grow text-left">{label}</span>
      </button>
    )
  }

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1">
        Library
      </p>

      {navItem(null, 'All Bookmarks', Inbox)}
      {navItem('reading', 'Reading List', BookOpen)}

      <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

      <div className="flex items-center justify-between px-3 mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Collections
        </p>
        <button
          onClick={() => setIsAdding(true)}
          className="text-slate-400 hover:text-blue-600 transition-colors"
          title="New collection"
        >
          <Plus size={13} />
        </button>
      </div>

      {localCollections.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group/item ${
            activeCollectionId === c.id
              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Folder size={14} className="shrink-0" style={{ color: c.color }} />
          <span className="truncate grow text-left">{c.name}</span>
          <Trash2
            size={12}
            className="shrink-0 opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition-all"
            onClick={(e) => handleDelete(c.id, e)}
          />
        </button>
      ))}

      {/* Inline add form */}
      {isAdding && (
        <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  newColor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleAdd}
              disabled={isSaving || !newName.trim()}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {isSaving ? 'Saving…' : 'Add'}
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats.total > 0 && (
        <>
          <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1">
            Stats
          </p>
          <div className="mx-1 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 space-y-2.5">
            {/* Total + this week */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <LayoutGrid size={11} className="text-blue-500 shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Saved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{stats.total}</span>
                {stats.thisWeek > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <TrendingUp size={9} />+{stats.thisWeek}
                  </span>
                )}
              </div>
            </div>

            {/* Read progress */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <BookOpen size={11} className="text-indigo-500 shrink-0" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Read</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {stats.readCount}/{stats.total}
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.readPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-slate-400">{stats.readPct}% done</span>
                <span className="text-[9px] text-slate-400">{stats.unread} left</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom actions */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-all"
        >
          <Settings size={14} className="shrink-0" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50 text-left w-full"
        >
          {isSigningOut
            ? <Loader2 size={14} className="shrink-0 animate-spin" />
            : <LogOut size={14} className="shrink-0" />
          }
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>

        {/* GitHub note */}
        <a
          href="https://github.com/devmanjunath31/vault-links"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 group block rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-all"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <svg viewBox="0 0 24 24" width="12" height="12" className="shrink-0 text-slate-500 dark:text-slate-400 fill-current">
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
              vault-links
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            If this helps you, a star means a lot. Also open for collaboration!
          </p>
        </a>
      </div>
    </aside>
  )
}
