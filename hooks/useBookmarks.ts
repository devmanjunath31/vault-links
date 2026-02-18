'use client'

/**
 * useBookmarks
 *
 * Encapsulates all Supabase Realtime subscription logic for the bookmarks table.
 * Keeps BookmarkList a pure presentational concern — it just renders what this
 * hook gives it and calls removeBookmark on optimistic delete.
 *
 * Filtering by user_id on the server-side channel prevents cross-user data leaks
 * even if RLS is misconfigured; defence in depth.
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bookmark } from '@/types/bookmark'

export function useBookmarks(initialBookmarks: Bookmark[], userId: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)

  useEffect(() => {
    // Create the client inside the effect so it is never a dependency.
    // Putting a new object reference in the dep array would cause the effect
    // to tear down and re-subscribe on every render, breaking Realtime.
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
            setBookmarks((prev) => [payload.new as Bookmark, ...prev])
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
  }, [userId]) // userId is the only true external dependency

  // Stable reference — safe to pass as a prop without triggering re-renders
  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return { bookmarks, removeBookmark }
}
