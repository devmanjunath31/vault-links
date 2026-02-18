'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Shield, Zap, Globe } from 'lucide-react'

const features = [
  { icon: Shield, text: 'Private by default — only you see your bookmarks' },
  { icon: Zap,    text: 'Real-time sync across all your open tabs' },
  { icon: Globe,  text: 'Auto-fetches page titles from any URL' },
]

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  async function handleGoogleSignIn() {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      console.error('OAuth error:', error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-blob animation-delay-0 absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute top-1/2 -right-32 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-32 left-1/3 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo + brand */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-lg opacity-40" />
              <div className="relative bg-linear-to-br from-blue-500 to-indigo-600 p-3.5 rounded-2xl shadow-lg">
                <Bookmark size={26} className="text-white" fill="white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Vault Links
              </h1>
              <p className="text-slate-400 text-sm mt-1.5">
                Your personal web, organized.
              </p>
            </div>
          </div>

          {/* Sign in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">Why Vault Links?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
                  <Icon size={12} className="text-blue-400" />
                </div>
                <span className="text-xs text-slate-400 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          No password needed · Sign in with Google
        </p>
      </div>
    </div>
  )
}
