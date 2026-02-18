'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useBookmarks } from '@/hooks/useBookmarks'
import BookmarkCard from '@/components/BookmarkCard'
import type { Bookmark } from '@/types/bookmark'
import {
  Bookmark as BookmarkIcon, Search, Globe, LayoutGrid, List,
  BookOpen, Tag, X,
} from 'lucide-react'

type SortOrder = 'newest' | 'oldest' | 'alpha' | 'most-visited'

interface BookmarkListProps {
  initialBookmarks: Bookmark[]
  userId: string
  searchInputRef: React.RefObject<HTMLInputElement | null>
  activeCollectionId: string | null
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function useLocalStorage<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return fallback
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : fallback
    } catch { return fallback }
  })

  const set = useCallback((v: T) => {
    setValue(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* noop */ }
  }, [key])

  return [value, set]
}

export default function BookmarkList({
  initialBookmarks,
  userId,
  searchInputRef,
  activeCollectionId,
}: BookmarkListProps) {
  const { bookmarks, updateBookmark, removeBookmark } = useBookmarks(initialBookmarks, userId)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useLocalStorage<SortOrder>('bm-sort', 'newest')
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('bm-view', 'grid')
  const [readingListOnly, setReadingListOnly] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // When sidebar switches to Reading List, toggle filter
  useEffect(() => {
    setReadingListOnly(activeCollectionId === 'reading')
  }, [activeCollectionId])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    bookmarks.forEach((b) => (b.tags ?? []).forEach((t) => set.add(t)))
    return [...set].sort()
  }, [bookmarks])

  const uniqueDomains = useMemo(
    () => new Set(bookmarks.map((b) => getDomain(b.url)).filter(Boolean)).size,
    [bookmarks]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    let result = bookmarks.filter((b) => {
      // Collection filter
      if (activeCollectionId && activeCollectionId !== 'reading') {
        if (b.collection_id !== activeCollectionId) return false
      }
      // Reading list filter
      if (readingListOnly && b.is_read) return false
      // Tag filter
      if (activeTag && !(b.tags ?? []).includes(activeTag)) return false
      // Text search
      if (q) {
        return (
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          (b.tags ?? []).some((t) => t.includes(q))
        )
      }
      return true
    })

    // Pinned always first
    const pinned = result.filter((b) => b.is_pinned)
    const rest = result.filter((b) => !b.is_pinned)

    const sortFn = (a: Bookmark, b: Bookmark) => {
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'alpha') return a.title.localeCompare(b.title)
      if (sort === 'most-visited') return b.click_count - a.click_count
      // newest (default)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }

    return [...pinned.sort(sortFn), ...rest.sort(sortFn)]
  }, [bookmarks, query, sort, activeCollectionId, readingListOnly, activeTag])

  const isEmpty = bookmarks.length === 0
  const noResults = !isEmpty && filtered.length === 0
  const unreadCount = useMemo(() => bookmarks.filter((b) => !b.is_read).length, [bookmarks])

  /* ── Empty state ──────────────────────────────── */
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <BookmarkIcon size={32} className="text-blue-300" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">+</span>
          </div>
        </div>
        <p className="text-slate-700 font-semibold text-base">No bookmarks yet</p>
        <p className="text-slate-400 text-sm mt-1.5 max-w-xs leading-relaxed">
          Paste any URL above to save your first bookmark. Titles are fetched automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Stats */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
              <LayoutGrid size={11} className="text-blue-500" />
            </div>
            <span className="text-sm font-bold text-slate-900">{bookmarks.length}</span>
            <span className="text-xs text-slate-400">saved</span>
          </div>
          <div className="w-px h-6 bg-slate-100" />
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center">
              <Globe size={11} className="text-violet-500" />
            </div>
            <span className="text-sm font-bold text-slate-900">{uniqueDomains}</span>
            <span className="text-xs text-slate-400">domains</span>
          </div>
          {unreadCount > 0 && (
            <>
              <div className="w-px h-6 bg-slate-100" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                  <BookOpen size={11} className="text-indigo-500" />
                </div>
                <span className="text-sm font-bold text-slate-900">{unreadCount}</span>
                <span className="text-xs text-slate-400">unread</span>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-40">
          <Search
            size={13}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all shadow-sm"
          />
        </div>

        {/* Reading list toggle */}
        <button
          onClick={() => setReadingListOnly((v) => !v)}
          className={`flex items-center gap-1.5 border rounded-2xl px-3 py-2.5 text-xs font-medium transition-all shadow-sm whitespace-nowrap ${
            readingListOnly
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <BookOpen size={13} />
          Unread
        </button>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOrder)}
          className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-medium text-slate-500 hover:border-slate-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="alpha">A → Z</option>
          <option value="most-visited">Most visited</option>
        </select>

        {/* View mode toggle */}
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
            title="List view"
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag((t) => (t === tag ? null : tag))}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                activeTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              <Tag size={10} />
              {tag}
              {activeTag === tag && <X size={10} />}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <Search size={24} className="text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium text-sm">No results found</p>
          <button
            onClick={() => { setQuery(''); setActiveTag(null) }}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Results count */}
      {filtered.length > 0 && (query || activeTag || readingListOnly) && (
        <p className="text-xs text-slate-400 px-0.5">
          {filtered.length} of {bookmarks.length} bookmarks
        </p>
      )}

      {/* Cards */}
      {filtered.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
              : 'flex flex-col gap-2'
          }
        >
          {filtered.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              viewMode={viewMode}
              onDelete={removeBookmark}
              onUpdate={updateBookmark}
            />
          ))}
        </div>
      )}
    </div>
  )
}
