'use client'

import { useRef, useState } from 'react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import CollectionsSidebar from '@/components/CollectionsSidebar'
import AddBookmarkForm from '@/components/AddBookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import type { Bookmark } from '@/types/bookmark'
import type { Collection } from '@/types/collection'

interface DashboardClientProps {
  initialBookmarks: Bookmark[]
  initialCollections: Collection[]
  userId: string
}

export default function DashboardClient({
  initialBookmarks,
  initialCollections,
  userId,
}: DashboardClientProps) {
  const urlInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)

  useKeyboardShortcuts({ urlInputRef, searchInputRef })

  return (
    <div className="flex gap-6 items-start">
      <CollectionsSidebar
        collections={initialCollections}
        activeCollectionId={activeCollectionId}
        onSelect={setActiveCollectionId}
      />

      <div className="flex-1 min-w-0 space-y-6">
        <AddBookmarkForm
          urlInputRef={urlInputRef}
          collections={initialCollections}
          activeCollectionId={activeCollectionId}
        />
        <BookmarkList
          initialBookmarks={initialBookmarks}
          userId={userId}
          searchInputRef={searchInputRef}
          activeCollectionId={activeCollectionId}
        />
      </div>
    </div>
  )
}
