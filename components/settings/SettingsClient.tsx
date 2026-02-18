'use client'

import { useState } from 'react'
import type { Profile } from '@/types/profile'
import type { Bookmark } from '@/types/bookmark'
import ProfilePanel from '@/components/settings/ProfilePanel'
import AppearancePanel from '@/components/settings/AppearancePanel'
import StatsPanel from '@/components/settings/StatsPanel'
import NotificationsPanel from '@/components/settings/NotificationsPanel'
import { User, Palette, BarChart2, Bell } from 'lucide-react'

type Tab = 'profile' | 'appearance' | 'stats' | 'notifications'

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       Icon: User },
  { id: 'appearance',    label: 'Appearance',     Icon: Palette },
  { id: 'stats',         label: 'Stats',          Icon: BarChart2 },
  { id: 'notifications', label: 'Notifications',  Icon: Bell },
]

interface SettingsClientProps {
  profile: Profile
  bookmarks: Bookmark[]
  userId: string
}

export default function SettingsClient({ profile, bookmarks, userId }: SettingsClientProps) {
  const [tab, setTab] = useState<Tab>('profile')

  return (
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
        {tab === 'stats'         && <StatsPanel bookmarks={bookmarks} />}
        {tab === 'notifications' && <NotificationsPanel profile={profile} bookmarks={bookmarks} userId={userId} />}
      </div>
    </div>
  )
}
