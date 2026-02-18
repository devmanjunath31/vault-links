'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Loader2, Link2, AlertTriangle, X, ChevronDown, Folder,
} from 'lucide-react'
import type { Collection } from '@/types/collection'

interface AddBookmarkFormProps {
  urlInputRef: React.RefObject<HTMLInputElement | null>
  collections: Collection[]
  activeCollectionId: string | null
}

interface FetchedMeta {
  title: string
  og_image: string | null
  description: string | null
}

export default function AddBookmarkForm({
  urlInputRef,
  collections,
  activeCollectionId,
}: AddBookmarkFormProps) {
  const [url, setUrl]                   = useState('')
  const [title, setTitle]               = useState('')
  const [tags, setTags]                 = useState<string[]>([])
  const [tagInput, setTagInput]         = useState('')
  const [collectionId, setCollectionId] = useState<string | null>(activeCollectionId)
  const [meta, setMeta]                 = useState<FetchedMeta | null>(null)
  const [isDuplicate, setIsDuplicate]   = useState(false)
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
    const trimmed = url.trim()
    if (!trimmed) return
    try { new URL(trimmed) } catch { return }

    setIsLoadingMeta(true)
    setMeta(null)
    setIsDuplicate(false)

    const [fetchRes, dupRes] = await Promise.all([
      fetch(`/api/fetch-title?url=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json() as Promise<FetchedMeta>)
        .catch(() => ({ title: '', og_image: null, description: null } as FetchedMeta)),
      supabase.from('bookmarks').select('id').eq('url', trimmed).limit(1),
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

    const trimmedUrl = url.trim()
    try { new URL(trimmedUrl) } catch {
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
    try { domain = new URL(trimmedUrl).hostname } catch { /* noop */ }

    const { error: insertError } = await supabase.from('bookmarks').insert({
      user_id: user.id,
      url: trimmedUrl,
      title: title.trim(),
      favicon_url: domain
        ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        : null,
      og_image: meta?.og_image ?? null,
      description: meta?.description ?? null,
      tags,
      collection_id: collectionId,
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
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    }

    setIsSubmitting(false)
  }

  const activeCollection = collections.find((c) => c.id === collectionId)

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* OG image preview banner */}
      {meta?.og_image && (
        <div className="relative h-28 bg-slate-100 overflow-hidden">
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

        {/* Duplicate warning */}
        {isDuplicate && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
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
              className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-slate-50 focus:bg-white"
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
          <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-9 border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 focus-within:bg-white transition-all">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium"
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
              className="flex-1 min-w-20 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
            />
          </div>

          {/* Collection picker */}
          <div className="relative shrink-0" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setShowCollectionPicker((v) => !v)}
              className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all whitespace-nowrap"
            >
              <Folder size={13} style={activeCollection ? { color: activeCollection.color } : undefined} className={activeCollection ? '' : 'text-slate-400'} />
              <span className="truncate max-w-32">{activeCollection?.name ?? 'No collection'}</span>
              <ChevronDown size={13} className="text-slate-400 shrink-0" />
            </button>

            {showCollectionPicker && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
                <button
                  type="button"
                  onClick={() => { setCollectionId(null); setShowCollectionPicker(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Folder size={13} className="text-slate-300" />
                  No collection
                </button>
                {collections.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCollectionId(c.id); setShowCollectionPicker(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
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
