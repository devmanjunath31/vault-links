'use client'

import { useRef, useState, useCallback } from 'react'
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

  const { bookmarks, updateBookmark, removeBookmark } = useBookmarks(initialBookmarks, userId)

  const openPalette = useCallback(() => setIsPaletteOpen(true), [])
  const openCapture = useCallback(() => setIsCaptureOpen(true), [])
  const handleExportCSV = useCallback(() => exportBookmarksAsCSV(bookmarks), [bookmarks])

  useKeyboardShortcuts({
    searchInputRef,
    onOpenPalette: openPalette,
    onOpenCapture: openCapture,
  })

  return (
    <>
      <div className="flex gap-6 items-start">
        <CollectionsSidebar
          collections={initialCollections}
          activeCollectionId={activeCollectionId}
          onSelect={setActiveCollectionId}
        />

        <div className="flex-1 min-w-0 space-y-4">
          <AddBookmarkForm
            urlInputRef={urlInputRef}
            collections={initialCollections}
            activeCollectionId={activeCollectionId}
          />
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
    </>
  )
}
