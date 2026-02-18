import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/settings/SettingsClient'
import type { Profile } from '@/types/profile'
import type { Bookmark } from '@/types/bookmark'
import { ArrowLeft, Settings } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, bookmarksResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookmarks').select('*').order('created_at', { ascending: false }),
  ])

  const profile: Profile = profileResult.data ?? {
    id: user.id,
    full_name: null,
    avatar_url: null,
    email: user.email ?? null,
    username: null,
    bio: null,
    theme: 'system',
    accent_color: '#3b82f6',
    notify_dead_links: false,
    view_density: 'comfortable' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const bookmarks: Bookmark[] = bookmarksResult.data ?? []

  return (
    <div className="min-h-screen bg-(--bg)">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-(--surface)/80 backdrop-blur-md border-b border-(--border)">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Settings size={15} />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your profile, appearance, and preferences.
          </p>
        </div>

        <SettingsClient profile={profile} bookmarks={bookmarks} userId={user.id} />
      </main>
    </div>
  )
}
