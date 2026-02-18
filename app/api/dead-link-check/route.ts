import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CheckRequest {
  bookmarkIds: string[]
}

interface BookmarkRow {
  id: string
  url: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as CheckRequest
  const { bookmarkIds } = body

  if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
  }

  // Fetch the URLs for the given bookmark IDs (scoped to the user via RLS)
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('id, url')
    .in('id', bookmarkIds)

  if (!bookmarks) return NextResponse.json({ results: [] })

  const results = await Promise.all(
    (bookmarks as BookmarkRow[]).map(async ({ id, url }) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      let is_dead = false
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        })
        is_dead = res.status >= 400
      } catch {
        is_dead = true
      } finally {
        clearTimeout(timeoutId)
      }

      // Update bookmark status in DB
      await supabase
        .from('bookmarks')
        .update({ is_dead, last_checked_at: new Date().toISOString() })
        .eq('id', id)

      return { id, is_dead }
    })
  )

  return NextResponse.json({ results })
}
