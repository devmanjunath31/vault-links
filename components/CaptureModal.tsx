'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Link2, Loader2 } from 'lucide-react'
import { normalizeUrl, autoTagsForUrl } from '@/lib/url-normalize'

interface CaptureModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function CaptureModal({ isOpen, onClose, userId }: CaptureModalProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      setUrl('')
      setTitle('')
      setError(null)
      setSaved(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  async function handleUrlBlur() {
    const trimmed = url.trim()
    if (!trimmed) return
    try { new URL(trimmed) } catch { return }

    setIsFetchingTitle(true)
    try {
      const { url: normalized } = normalizeUrl(trimmed)
      if (normalized !== trimmed) setUrl(normalized)
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(normalized)}`)
      const data = await res.json() as { title: string }
      if (data.title && !title) setTitle(data.title)
    } catch { /* noop */ } finally {
      setIsFetchingTitle(false)
    }
  }

  async function handleSave() {
    const raw = url.trim()
    if (!raw) return
    let normalized = raw
    try {
      new URL(raw)
      normalized = normalizeUrl(raw).url
    } catch {
      setError('Enter a valid URL')
      return
    }

    setIsSaving(true)
    setError(null)

    let domain = ''
    try { domain = new URL(normalized).hostname } catch { /* noop */ }

    const autoTags = autoTagsForUrl(normalized)

    const { error: insertError } = await supabase.from('bookmarks').insert({
      user_id: userId,
      url: normalized,
      title: title.trim() || normalized,
      favicon_url: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null,
      tags: autoTags,
    })

    setIsSaving(false)

    if (insertError) {
      setError('Failed to save. Try again.')
    } else {
      setSaved(true)
      setTimeout(() => onClose(), 1200)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Quick Capture</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Bookmark saved!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Link2 size={14} />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Title (auto-fetched)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 transition-all"
              />
              {isFetchingTitle && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleSave}
              disabled={isSaving || !url.trim()}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isSaving ? 'Saving…' : 'Save bookmark'}
            </button>

            <p className="text-center text-xs text-slate-400">
              Press <kbd className="border border-slate-200 dark:border-slate-700 rounded px-1">Enter</kbd> to save &nbsp;·&nbsp; <kbd className="border border-slate-200 dark:border-slate-700 rounded px-1">Esc</kbd> to close
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
