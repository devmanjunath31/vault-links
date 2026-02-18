import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/DashboardClient'
import UserAvatar from '@/components/UserAvatar'
import type { Bookmark } from '@/types/bookmark'
import type { Collection } from '@/types/collection'
import type { Profile } from '@/types/profile'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all data in parallel — no sequential waterfall
  const [bookmarksResult, profileResult, collectionsResult] = await Promise.all([
    supabase.from('bookmarks').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('collections').select('*').order('created_at', { ascending: true }),
  ])

  if (bookmarksResult.error) {
    console.error('Error fetching bookmarks:', bookmarksResult.error.message)
  }
  if (profileResult.error && profileResult.error.code !== 'PGRST116') {
    console.error('Error fetching profile:', profileResult.error.message)
  }
  if (collectionsResult.error) {
    console.error('Error fetching collections:', collectionsResult.error.message)
  }

  const initialBookmarks: Bookmark[] = bookmarksResult.data ?? []
  const profile: Profile | null = profileResult.data ?? null
  const initialCollections: Collection[] = collectionsResult.data ?? []

  return (
    <div className="min-h-screen bg-(--bg)">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-(--surface)/80 backdrop-blur-md border-b border-(--border)">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
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
            <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Vault Links
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard shortcut hints */}
            <div className="hidden md:flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
              <span className="text-[11px]">add</span>
              <kbd className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono">
                /
              </kbd>
              <span className="text-[11px]">search</span>
            </div>
            <UserAvatar user={user} profile={profile} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <DashboardClient
          initialBookmarks={initialBookmarks}
          initialCollections={initialCollections}
          userId={user.id}
        />
      </main>
    </div>
  )
}
