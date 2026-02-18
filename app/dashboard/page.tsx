import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookmarkList from '@/components/BookmarkList'
import AddBookmarkForm from '@/components/AddBookmarkForm'
import UserAvatar from '@/components/UserAvatar'
import type { Bookmark } from '@/types/bookmark'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookmarks:', error.message)
  }

  const initialBookmarks: Bookmark[] = bookmarks ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header with backdrop blur */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="white"
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">
              Smart Bookmarks
            </span>
          </div>
          <UserAvatar user={user} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <AddBookmarkForm />
        <BookmarkList initialBookmarks={initialBookmarks} userId={user.id} />
      </main>
    </div>
  )
}
