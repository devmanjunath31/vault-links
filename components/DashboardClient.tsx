'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useBookmarks } from '@/hooks/useBookmarks'
import CollectionsSidebar from '@/components/CollectionsSidebar'
import AddBookmarkForm from '@/components/AddBookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import CommandPalette from '@/components/CommandPalette'
import CaptureModal from '@/components/CaptureModal'
import WeeklyDigest from '@/components/WeeklyDigest'
import type { Bookmark } from '@/types/bookmark'
import type { Collection } from '@/types/collection'

interface DashboardClientProps {
  initialBookmarks: Bookmark[]
  initialCollections: Collection[]
  userId: string
}

function exportBookmarksAsCSV(bookmarks: Bookmark[]) {
  const headers = ['title', 'url', 'tags', 'collection_id', 'is_read', 'click_count', 'reading_time_minutes', 'created_at']
  const rows = bookmarks.map((b) =>
    [
      `"${b.title.replace(/"/g, '""')}"`,
      b.url,
      `"${(b.tags ?? []).join(', ')}"`,
      b.collection_id ?? '',
      String(b.is_read),
      String(b.click_count),
      String(b.reading_time_minutes ?? ''),
      b.created_at,
    ].join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookmarks-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DashboardClient({
  initialBookmarks,
  initialCollections,
  userId,
}: DashboardClientProps) {
  const urlInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isCaptureOpen, setIsCaptureOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { bookmarks, updateBookmark, removeBookmark } = useBookmarks(initialBookmarks, userId)

  const openPalette = useCallback(() => setIsPaletteOpen(true), [])
  const openCapture = useCallback(() => setIsCaptureOpen(true), [])

  // Auto-focus URL input when add modal opens
  useEffect(() => {
    if (isAddOpen) {
      setTimeout(() => urlInputRef.current?.focus(), 50)
    }
  }, [isAddOpen])

  // Close add modal on Escape
  useEffect(() => {
    if (!isAddOpen) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsAddOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isAddOpen])
  const handleExportCSV = useCallback(() => exportBookmarksAsCSV(bookmarks), [bookmarks])

  useKeyboardShortcuts({
    searchInputRef,
    onOpenPalette: openPalette,
    onOpenCapture: openCapture,
  })

  return (
    <>
      <div className="flex gap-6 items-start">
        <div className="sticky top-14 self-start shrink-0 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <CollectionsSidebar
            collections={initialCollections}
            bookmarks={bookmarks}
            activeCollectionId={activeCollectionId}
            onSelect={setActiveCollectionId}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {/* Add bookmark trigger button */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm px-5 py-4 text-left hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500 group-hover:bg-blue-600 transition-colors flex items-center justify-center shrink-0">
              <Plus size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Add Bookmark</p>
              <p className="text-xs text-slate-400 mt-0.5">Paste a URL to save it</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-1.5 text-slate-300 dark:text-slate-600 shrink-0">
              <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono">⌘⇧B</kbd>
              <span className="text-xs">quick add</span>
            </div>
          </button>
          <WeeklyDigest
            bookmarks={bookmarks}
            onActivateReadingList={() => setActiveCollectionId('reading')}
          />
          <BookmarkList
            bookmarks={bookmarks}
            updateBookmark={updateBookmark}
            removeBookmark={removeBookmark}
            searchInputRef={searchInputRef}
            activeCollectionId={activeCollectionId}
            onExportCSV={handleExportCSV}
          />
        </div>
      </div>

      <CommandPalette
        bookmarks={bookmarks}
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onExportCSV={handleExportCSV}
        onOpenCapture={() => { setIsCaptureOpen(true); setIsPaletteOpen(false) }}
      />

      <CaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        userId={userId}
      />

      {/* Add Bookmark Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddOpen(false) }}
        >
          <div className="w-full max-w-xl">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">New Bookmark</span>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <AddBookmarkForm
              urlInputRef={urlInputRef}
              collections={initialCollections}
              activeCollectionId={activeCollectionId}
              onSuccess={() => setIsAddOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
