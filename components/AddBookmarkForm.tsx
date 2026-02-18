'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizeUrl, autoTagsForUrl } from '@/lib/url-normalize'
import {
  Plus, Loader2, Link2, AlertTriangle, X, ChevronDown, Folder, ShieldCheck,
} from 'lucide-react'
import type { Collection } from '@/types/collection'

interface AddBookmarkFormProps {
  urlInputRef: React.RefObject<HTMLInputElement | null>
  collections: Collection[]
  activeCollectionId: string | null
  onSuccess?: () => void
}

interface FetchedMeta {
  title: string
  og_image: string | null
  description: string | null
  reading_time_minutes?: number | null
}

export default function AddBookmarkForm({
  urlInputRef,
  collections,
  activeCollectionId,
  onSuccess,
}: AddBookmarkFormProps) {
  const [url, setUrl]                   = useState('')
  const [title, setTitle]               = useState('')
  const [tags, setTags]                 = useState<string[]>([])
  const [tagInput, setTagInput]         = useState('')
  const [collectionId, setCollectionId] = useState<string | null>(activeCollectionId)
  const [meta, setMeta]                 = useState<FetchedMeta | null>(null)
  const [isDuplicate, setIsDuplicate]   = useState(false)
  const [strippedCount, setStrippedCount] = useState(0)
  const [isLoadingMeta, setIsLoadingMeta] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Sync collection picker when user changes collection in sidebar
  useEffect(() => {
    if (activeCollectionId !== 'reading') {
      setCollectionId(activeCollectionId)
    }
  }, [activeCollectionId])

  // Close picker on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowCollectionPicker(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function handleUrlBlur() {
    const raw = url.trim()
    if (!raw) return
    try { new URL(raw) } catch { return }

    // Normalize URL (strip tracking params)
    const { url: normalized, strippedCount: stripped } = normalizeUrl(raw)
    if (normalized !== raw) setUrl(normalized)
    setStrippedCount(stripped)

    setIsLoadingMeta(true)
    setMeta(null)
    setIsDuplicate(false)

    // Auto-suggest tags from domain
    const suggested = autoTagsForUrl(normalized)
    if (suggested.length > 0) {
      setTags((prev) => {
        const merged = [...prev]
        for (const t of suggested) {
          if (!merged.includes(t)) merged.push(t)
        }
        return merged
      })
    }

    const [fetchRes, dupRes] = await Promise.all([
      fetch(`/api/fetch-title?url=${encodeURIComponent(normalized)}`)
        .then((r) => r.json() as Promise<FetchedMeta>)
        .catch(() => ({ title: '', og_image: null, description: null, reading_time_minutes: null } as FetchedMeta)),
      supabase.from('bookmarks').select('id').eq('url', normalized).limit(1),
    ])

    if (fetchRes.title && !title) setTitle(fetchRes.title)
    setMeta(fetchRes)
    setIsDuplicate((dupRes.data?.length ?? 0) > 0)
    setIsLoadingMeta(false)
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag])
    setTagInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const raw = url.trim()
    let normalized = raw
    try {
      new URL(raw)
      normalized = normalizeUrl(raw).url
    } catch {
      setError('Please enter a valid URL (include https://)')
      return
    }
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to add bookmarks.')
      setIsSubmitting(false)
      return
    }

    let domain = ''
    try { domain = new URL(normalized).hostname } catch { /* noop */ }

    const { error: insertError } = await supabase.from('bookmarks').insert({
      user_id: user.id,
      url: normalized,
      title: title.trim(),
      favicon_url: domain
        ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        : null,
      og_image: meta?.og_image ?? null,
      description: meta?.description ?? null,
      tags,
      collection_id: collectionId,
      reading_time_minutes: meta?.reading_time_minutes ?? null,
    })

    if (insertError) {
      setError('Failed to save bookmark. Please try again.')
    } else {
      setUrl('')
      setTitle('')
      setTags([])
      setTagInput('')
      setMeta(null)
      setIsDuplicate(false)
      setStrippedCount(0)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 1200)
    }

    setIsSubmitting(false)
  }

  const activeCollection = collections.find((c) => c.id === collectionId)

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm"
    >
      {/* OG image preview banner */}
      {meta?.og_image && (
        <div className="relative h-28 bg-slate-100 dark:bg-slate-700 overflow-hidden rounded-t-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.og_image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
          {meta.description && (
            <p className="absolute bottom-2 left-3 right-3 text-white text-xs line-clamp-2 leading-relaxed drop-shadow">
              {meta.description}
            </p>
          )}
        </div>
      )}

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Add Bookmark</h2>
          <div className="flex items-center gap-2">
            {strippedCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                <ShieldCheck size={10} />
                {strippedCount} tracking param{strippedCount !== 1 ? 's' : ''} removed
              </span>
            )}
            {success && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-fade-in-up">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved!
              </span>
            )}
          </div>
        </div>

        {/* Duplicate warning */}
        {isDuplicate && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle size={13} className="shrink-0" />
            <span>This URL is already in your bookmarks.</span>
          </div>
        )}

        {/* URL + Title */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Link2 size={14} />
            </div>
            <input
              ref={urlInputRef}
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600"
            />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600"
            />
            {isLoadingMeta && (
              <Loader2
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
                size={14}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingMeta}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm hover:shadow active:scale-[0.98]"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} strokeWidth={2.5} />}
            {isSubmitting ? 'Saving…' : 'Add'}
          </button>
        </div>

        {/* Tags + Collection row */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Tags chip input */}
          <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-9 border border-slate-200 dark:border-slate-600 rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-slate-600 transition-all">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={tags.length === 0 ? 'Tags (Enter or ,)' : ''}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput) addTag(tagInput) }}
              className="flex-1 min-w-20 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent outline-none"
            />
          </div>

          {/* Collection picker */}
          <div className="relative shrink-0" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setShowCollectionPicker((v) => !v)}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 transition-all whitespace-nowrap"
            >
              <Folder size={13} style={activeCollection ? { color: activeCollection.color } : undefined} className={activeCollection ? '' : 'text-slate-400'} />
              <span className="truncate max-w-32">{activeCollection?.name ?? 'No collection'}</span>
              <ChevronDown size={13} className="text-slate-400 shrink-0" />
            </button>

            {showCollectionPicker && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-60 py-1">
                <button
                  type="button"
                  onClick={() => { setCollectionId(null); setShowCollectionPicker(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Folder size={13} className="text-slate-300" />
                  No collection
                </button>
                {collections.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCollectionId(c.id); setShowCollectionPicker(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Folder size={13} style={{ color: c.color }} />
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
      </div>
    </form>
  )
}
