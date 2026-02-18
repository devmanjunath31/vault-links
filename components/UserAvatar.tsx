'use client'

import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/profile'

interface UserAvatarProps {
  user: User
  profile: Profile | null
}

export default function UserAvatar({ user, profile }: UserAvatarProps) {
  const avatarUrl =
    profile?.avatar_url ??
    (user.user_metadata['avatar_url'] as string | undefined) ??
    null

  const name =
    profile?.full_name ??
    (user.user_metadata['full_name'] as string | undefined) ??
    profile?.email ??
    user.email ??
    'User'

  const firstName = name.split(' ')[0]

  return (
    <div className="flex items-center gap-2">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          width={30}
          height={30}
          className="rounded-full ring-2 ring-slate-200 dark:ring-slate-700"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
          {firstName[0].toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
        {firstName}
      </span>
    </div>
  )
}
