'use client'

import { useMemo, useState } from 'react'
import { useBookmarks } from '@/hooks/useBookmarks'
import BookmarkCard from '@/components/BookmarkCard'
import type { Bookmark } from '@/types/bookmark'
import { Bookmark as BookmarkIcon, Search, ArrowUpDown } from 'lucide-react'

interface BookmarkListProps {
  initialBookmarks: Bookmark[]
  userId: string
}

type SortOrder = 'newest' | 'oldest'

export default function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
  const { bookmarks, removeBookmark } = useBookmarks(initialBookmarks, userId)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOrder>('newest')

  // Client-side filter — fast enough for personal bookmark counts.
  // Would swap to a Postgres full-text search (tsvector) at scale.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const result = q
      ? bookmarks.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.url.toLowerCase().includes(q)
        )
      : [...bookmarks]

    return sort === 'oldest' ? result.reverse() : result
  }, [bookmarks, query, sort])

  const isEmpty = bookmarks.length === 0
  const noResults = !isEmpty && filtered.length === 0

  return (
    <div className="space-y-3">
      {/* Search + sort toolbar — only shown when there are bookmarks */}
      {!isEmpty && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search bookmarks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-white"
            />
          </div>

          <button
            onClick={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
            title={sort === 'newest' ? 'Showing newest first' : 'Showing oldest first'}
            className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all whitespace-nowrap"
          >
            <ArrowUpDown size={13} />
            {sort === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      )}

      {/* Empty state — no bookmarks at all */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <BookmarkIcon size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold">No bookmarks yet</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            Paste a URL above and hit{' '}
            <span className="font-medium text-slate-500">Add</span> to save
            your first bookmark.
          </p>
        </div>
      )}

      {/* No search results */}
      {noResults && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search size={28} className="text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium text-sm">No results for &ldquo;{query}&rdquo;</p>
          <button
            onClick={() => setQuery('')}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Results */}
      {filtered.length > 0 && (
        <>
          <div className="flex items-center gap-3 px-0.5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
              {query
                ? `${filtered.length} of ${bookmarks.length}`
                : `${bookmarks.length} ${bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}`}
            </p>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="space-y-2">
            {filtered.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onDelete={removeBookmark}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
