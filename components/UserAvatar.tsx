'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { LogOut } from 'lucide-react'

interface UserAvatarProps {
  user: User
}

export default function UserAvatar({ user }: UserAvatarProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const avatarUrl = user.user_metadata['avatar_url'] as string | undefined
  const name =
    (user.user_metadata['full_name'] as string | undefined) ??
    user.email ??
    'User'
  const firstName = name.split(' ')[0]

  async function handleSignOut() {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex items-center gap-2.5">
      {/* Avatar */}
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          width={30}
          height={30}
          className="rounded-full ring-2 ring-slate-200"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
          {name[0].toUpperCase()}
        </div>
      )}

      {/* Name */}
      <span className="text-sm font-medium text-slate-700 hidden sm:inline">
        {firstName}
      </span>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50 ml-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200"
        aria-label="Sign out"
      >
        {isSigningOut ? (
          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <LogOut size={13} />
        )}
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  )
}
