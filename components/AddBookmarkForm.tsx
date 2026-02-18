'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, Link2, Type } from 'lucide-react'

export default function AddBookmarkForm() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [isLoadingTitle, setIsLoadingTitle] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleUrlBlur() {
    if (!url || title) return
    try {
      new URL(url)
    } catch {
      return
    }

    setIsLoadingTitle(true)
    try {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`)
      const data = (await res.json()) as { title: string }
      if (data.title) setTitle(data.title)
    } catch {
      // silently fail — user can type title manually
    } finally {
      setIsLoadingTitle(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL (include https://)')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setIsSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to add bookmarks.')
      setIsSubmitting(false)
      return
    }

    let domain = ''
    try {
      domain = new URL(url).hostname
    } catch {
      domain = ''
    }

    const { error: insertError } = await supabase.from('bookmarks').insert({
      user_id: user.id,
      url: url.trim(),
      title: title.trim(),
      favicon_url: domain
        ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        : null,
    })

    if (insertError) {
      setError('Failed to save bookmark. Please try again.')
    } else {
      setUrl('')
      setTitle('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    }

    setIsSubmitting(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800 text-sm">Add Bookmark</h2>
        {success && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-fade-in-up">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved!
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* URL input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Link2 size={14} />
          </div>
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Title input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Type size={14} />
          </div>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
          />
          {isLoadingTitle && (
            <Loader2
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
              size={14}
            />
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || isLoadingTitle}
          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow active:scale-[0.98]"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <Plus size={15} strokeWidth={2.5} />
          )}
          {isSubmitting ? 'Saving…' : 'Add'}
        </button>
      </div>

      {error && (
        <p className="mt-2.5 text-xs text-red-500 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </form>
  )
}
