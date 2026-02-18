'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Star, Clock, Tag } from 'lucide-react'

const mockCards = [
  { favicon: 'G', domain: 'github.com',  title: 'Build in public — a guide for indie hackers',  tag: 'dev',    time: '5m',  color: 'bg-slate-700' },
  { favicon: 'Y', domain: 'youtube.com', title: 'The future of AI-assisted coding workflows',    tag: 'ai',     time: '12m', color: 'bg-red-900/60' },
  { favicon: 'M', domain: 'medium.com',  title: 'Why great engineers ship, not perfect',         tag: 'career', time: '6m',  color: 'bg-slate-700' },
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
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">

      {/* ── Left: hero panel (desktop only) ───────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 relative p-14 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-blob animation-delay-0 absolute -top-48 -left-48 w-120 h-120 bg-blue-600/25 rounded-full blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute bottom-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="animate-blob animation-delay-4000 absolute top-1/2 left-1/3 w-72 h-72 bg-indigo-700/15 rounded-full blur-3xl" />
        </div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg">
              <Bookmark size={16} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Vault Links</span>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1.5 mb-7 w-fit">
              <Star size={10} className="text-blue-400" fill="currentColor" />
              <span className="text-xs text-blue-300 font-medium">Your personal bookmark vault</span>
            </div>

            <h2 className="text-5xl font-bold text-white leading-[1.1] tracking-tight mb-5">
              Save the web.<br />
              <span className="bg-linear-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Find it later.
              </span>
            </h2>

            <p className="text-slate-500 text-base leading-relaxed mb-10">
              Stop losing great reads in a sea of open tabs. One place to save,
              tag, and rediscover everything that matters to you.
            </p>

            {/* Mock bookmark cards */}
            <div className="space-y-2.5">
              {mockCards.map(({ favicon, domain, title, tag, time, color }, i) => (
                <div
                  key={domain}
                  className="flex items-center gap-3 bg-slate-800/50 border border-white/6 rounded-xl px-4 py-3 transition-all"
                  style={{ opacity: 1 - i * 0.18 }}
                >
                  <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-300`}>
                    {favicon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{domain}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full px-2 py-0.5">
                      <Tag size={8} />
                      {tag}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-600">
                      <Clock size={9} />
                      {time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {['Auto-fetch titles', 'Smart auto-tags', 'Reading time', 'Collections', 'Cmd+K search'].map((f) => (
                <span key={f} className="text-[11px] text-slate-500 border border-slate-800 rounded-full px-3 py-1">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-700">Open source · Free forever · No tracking</p>
        </div>
      </div>


      {/* Vertical divider */}
      <div className="hidden lg:block w-px bg-white/6 my-0" />

      {/* ── Right: login panel ─────────────────────────────────────── */}
      <div className="flex-1 lg:flex-none lg:w-110 flex flex-col items-center justify-center p-8 relative">
        {/* Mobile-only background */}
        <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
          <div className="animate-blob animation-delay-0 absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute -bottom-32 -right-32 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-4 mb-10 lg:hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-linear-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-xl">
                <Bookmark size={28} className="text-white" fill="white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-tight">Vault Links</h1>
              <p className="text-slate-400 text-sm mt-1.5">Your personal web, organized.</p>
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">Get started</p>
            <h2 className="text-3xl font-bold text-white leading-tight">Sign in to<br />Vault Links</h2>
            <p className="text-slate-500 text-sm mt-2.5">Save and organize the web, your way.</p>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-7 shadow-2xl">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

            <p className="text-center text-xs text-slate-600 mt-4">
              No password needed · Takes 5 seconds
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-7">
            {[
              { label: 'Private',    sub: 'by default' },
              { label: 'No ads',     sub: 'ever' },
              { label: 'Free',       sub: 'forever' },
            ].map(({ label, sub }) => (
              <div key={label} className="text-center">
                <p className="text-xs font-semibold text-slate-400">{label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
