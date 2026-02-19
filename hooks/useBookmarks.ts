'use client'

/**
 * useBookmarks
 *
 * Encapsulates all Supabase Realtime subscription logic for the bookmarks table.
 * Keeps BookmarkList a pure presentational concern.
 *
 * Handles INSERT / UPDATE / DELETE events from Postgres Realtime.
 * Filtering by user_id on the channel prevents cross-user data leaks
 * even if RLS is misconfigured — defence in depth.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark } from '@/types/bookmark'

export function useBookmarks(initialBookmarks: Bookmark[], userId: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)

  useEffect(() => {
    // Create the client inside the effect — never a stale dependency reference
    const supabase = createClient()

    const channel = supabase
      .channel('bookmarks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as Bookmark
            // Dedup: optimistic update may have already added this row
            setBookmarks((prev) =>
              prev.some((b) => b.id === incoming.id) ? prev : [incoming, ...prev]
            )
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Bookmark
            setBookmarks((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id
            setBookmarks((prev) => prev.filter((b) => b.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Optimistic add — call immediately after a successful insert so the row
  // appears instantly without waiting for the Realtime event.
  const addBookmark = useCallback((bookmark: Bookmark) => {
    setBookmarks((prev) =>
      prev.some((b) => b.id === bookmark.id) ? prev : [bookmark, ...prev]
    )
  }, [])

  // Optimistic local update — avoids a round-trip for pin/read toggles
  const updateBookmark = useCallback((id: string, patch: Partial<Bookmark>) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    )
  }, [])

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return { bookmarks, addBookmark, updateBookmark, removeBookmark }
}
