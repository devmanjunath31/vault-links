'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/profile'
import type { Bookmark } from '@/types/bookmark'
import ProfilePanel from '@/components/settings/ProfilePanel'
import AppearancePanel from '@/components/settings/AppearancePanel'
import NotificationsPanel from '@/components/settings/NotificationsPanel'
import { User, Palette, Bell, Trash2, AlertTriangle, Loader2 } from 'lucide-react'

type Tab = 'profile' | 'appearance' | 'notifications'

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       Icon: User },
  { id: 'appearance',    label: 'Appearance',     Icon: Palette },
  { id: 'notifications', label: 'Notifications',  Icon: Bell },
]

interface SettingsClientProps {
  profile: Profile
  bookmarks: Bookmark[]
  userId: string
}

export default function SettingsClient({ profile, bookmarks, userId }: SettingsClientProps) {
  const [tab, setTab] = useState<Tab>('profile')
  const [showDeleteZone, setShowDeleteZone] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleDeleteAccount() {
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        setDeleteError(data.error ?? 'Failed to delete account. Try again.')
        setIsDeleting(false)
        return
      }
      // Sign out and redirect — account is gone
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      setDeleteError('Something went wrong. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row gap-8">
        {/* Sidebar nav */}
        <nav className="sm:w-48 shrink-0">
          <ul className="flex flex-row sm:flex-col gap-1 overflow-x-auto pb-2 sm:pb-0">
            {TABS.map(({ id, label, Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${
                    tab === id
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'profile'       && <ProfilePanel profile={profile} userId={userId} />}
          {tab === 'appearance'    && <AppearancePanel />}
          {tab === 'notifications' && <NotificationsPanel profile={profile} bookmarks={bookmarks} userId={userId} />}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 dark:border-red-900 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowDeleteZone((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">Danger zone</span>
          </div>
          <span className="text-xs text-red-400 dark:text-red-500">{showDeleteZone ? 'Hide' : 'Show'}</span>
        </button>

        {showDeleteZone && (
          <div className="px-5 py-5 space-y-4 bg-white dark:bg-slate-900">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Delete account</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This permanently deletes your account, all bookmarks, collections, and any other data.
                This action <strong className="text-slate-700 dark:text-slate-300">cannot be undone</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Type <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full max-w-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
              />
            </div>

            {deleteError && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <AlertTriangle size={11} />
                {deleteError}
              </p>
            )}

            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirm.trim().toUpperCase() !== 'DELETE'}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting
                ? <Loader2 size={14} className="animate-spin" />
                : <Trash2 size={14} />
              }
              {isDeleting ? 'Deleting account…' : 'Permanently delete account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
