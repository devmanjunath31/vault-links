'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Trash2, Copy, Check, ExternalLink, Pin, BookOpen, Tag, AlertTriangle,
  StickyNote, Clock,
} from 'lucide-react'
import type { Bookmark } from '@/types/bookmark'
import GitHubMetaDisplay from '@/components/GitHubMeta'

type Density = 'compact' | 'comfortable' | 'cozy'

interface BookmarkCardProps {
  bookmark: Bookmark
  viewMode: 'grid' | 'list'
  density: Density
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Bookmark>) => void
}

function relativeTime(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function domainHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

export default function BookmarkCard({ bookmark, viewMode, density, onDelete, onUpdate }: BookmarkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied]         = useState(false)
  const [showNote, setShowNote]     = useState(false)
  const [noteText, setNoteText]     = useState(bookmark.notes ?? '')
  const supabase = createClient()

  let domain  = ''
  let urlPath = ''
  try {
    const parsed = new URL(bookmark.url)
    domain  = parsed.hostname.replace(/^www\./, '')
    urlPath = parsed.pathname === '/' ? '' : parsed.pathname
  } catch { /* noop */ }

  const hue         = domainHue(domain)
  const accentColor = `hsl(${hue}, 65%, 48%)`
  const accentBg    = `hsl(${hue}, 80%, 96%)`
  const faviconUrl  = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

  // Staleness: >180 days old, never clicked, never read
  const isStale = useMemo(() => {
    const ageDays = (Date.now() - new Date(bookmark.created_at).getTime()) / 86_400_000
    return ageDays > 180 && bookmark.click_count === 0 && !bookmark.is_read
  }, [bookmark.created_at, bookmark.click_count, bookmark.is_read])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard not available */ }
  }

  async function handleDelete() {
    setIsDeleting(true)
    onDelete(bookmark.id)
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmark.id)
    if (error) { console.error('Delete error:', error.message); setIsDeleting(false) }
  }

  async function handlePin() {
    const is_pinned = !bookmark.is_pinned
    onUpdate(bookmark.id, { is_pinned })
    await supabase.from('bookmarks').update({ is_pinned }).eq('id', bookmark.id)
  }

  async function handleToggleRead() {
    const is_read = !bookmark.is_read
    onUpdate(bookmark.id, { is_read })
    await supabase.from('bookmarks').update({ is_read }).eq('id', bookmark.id)
  }

  async function handleLinkClick() {
    const click_count = bookmark.click_count + 1
    onUpdate(bookmark.id, { click_count })
    supabase.from('bookmarks').update({ click_count }).eq('id', bookmark.id)
  }

  async function handleNoteBlur() {
    const trimmed = noteText.trim()
    const existing = (bookmark.notes ?? '').trim()
    if (trimmed === existing) return
    const notes = trimmed || null
    onUpdate(bookmark.id, { notes })
    await supabase.from('bookmarks').update({ notes }).eq('id', bookmark.id)
  }

  const FaviconEl = () => (
    <div
      className="shrink-0 w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center"
      style={{ background: accentBg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUrl}
        alt=""
        width={16}
        height={16}
        onError={(e) => {
          const el = e.target as HTMLImageElement
          el.style.display = 'none'
          const parent = el.parentElement
          if (parent) {
            parent.innerHTML = `<span style="font-size:11px;font-weight:700;color:${accentColor}">${(domain[0] ?? '?').toUpperCase()}</span>`
          }
        }}
      />
    </div>
  )

  const ActionButtons = ({ size = 13 }: { size?: number }) => (
    <>
      <button
        onClick={handlePin}
        className={`p-1.5 rounded-lg transition-all active:scale-95 ${bookmark.is_pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-950' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950'}`}
        title={bookmark.is_pinned ? 'Unpin' : 'Pin'}
      >
        <Pin size={size} />
      </button>
      <button
        onClick={handleToggleRead}
        className={`p-1.5 rounded-lg transition-all active:scale-95 ${bookmark.is_read ? 'text-slate-300 dark:text-slate-600 hover:text-indigo-500' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950 hover:text-indigo-700'}`}
        title={bookmark.is_read ? 'Mark unread' : 'Mark read'}
      >
        <BookOpen size={size} />
      </button>
      <button
        onClick={() => setShowNote((v) => !v)}
        className={`p-1.5 rounded-lg transition-all active:scale-95 ${showNote || bookmark.notes ? 'text-amber-500 bg-amber-50 dark:bg-amber-950' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        title="Notes"
      >
        <StickyNote size={size} />
      </button>
      <button
        onClick={handleCopy}
        className={`p-1.5 rounded-lg transition-all active:scale-95 ${copied ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        title={copied ? 'Copied!' : 'Copy URL'}
      >
        {copied ? <Check size={size} /> : <Copy size={size} />}
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all disabled:opacity-30 active:scale-95"
      >
        <Trash2 size={size} />
      </button>
    </>
  )

  const NoteArea = () => (
    <div className="px-1 pt-2">
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        onBlur={handleNoteBlur}
        placeholder="Add a private note…"
        rows={2}
        className="w-full text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
      />
    </div>
  )

  const ReadingTimeBadge = ({ small = false }: { small?: boolean }) => {
    if (!bookmark.reading_time_minutes) return null
    return (
      <span className={`flex items-center gap-0.5 text-slate-400 dark:text-slate-500 ${small ? 'text-[10px]' : 'text-xs'}`}>
        <Clock size={small ? 9 : 10} />
        ~{bookmark.reading_time_minutes}m
      </span>
    )
  }

  /* ── List view ──────────────────────────────── */
  if (viewMode === 'list') {
    const isCompact = density === 'compact'
    const isCozy = density === 'cozy'
    const py = isCompact ? 'py-2' : isCozy ? 'py-4' : 'py-3'
    const px = isCompact ? 'px-3' : isCozy ? 'px-5' : 'px-4'

    return (
      <div className={`animate-fade-in-up group relative border rounded-xl flex flex-col hover:shadow-sm transition-all duration-200 ${isStale ? 'opacity-75' : ''} ${
        bookmark.is_dead
          ? 'border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20'
          : bookmark.is_pinned
            ? 'border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20'
            : isStale
              ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}>
        {/* Main row */}
        <div className={`flex items-center gap-3 ${px} ${py}`}>
          <FaviconEl />

          <div className="flex-1 min-w-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className={`text-sm font-medium transition-colors truncate block hover:text-blue-600 dark:hover:text-blue-400 ${
                bookmark.is_dead
                  ? 'text-slate-400 dark:text-slate-500 line-through'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {bookmark.title}
            </a>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">{domain}</span>
              {bookmark.reading_time_minutes && <ReadingTimeBadge small />}
              {bookmark.is_dead && (
                <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium">
                  <AlertTriangle size={9} /> Dead link
                </span>
              )}
              {isStale && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                  <Clock size={9} /> Stale
                </span>
              )}
              {!isCompact && (bookmark.tags ?? []).length > 0 && (
                <div className="flex gap-1">
                  {(bookmark.tags ?? []).slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
            {relativeTime(bookmark.created_at)}
          </span>

          <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <ActionButtons size={12} />
          </div>
        </div>

        {/* Note area */}
        {showNote && (
          <div className={`${px} pb-3`}>
            <NoteArea />
          </div>
        )}
      </div>
    )
  }

  /* ── Grid view ──────────────────────────────── */
  const isCompact = density === 'compact'
  const isCozy = density === 'cozy'
  const ogHeight = isCozy ? 'h-48' : 'h-32'
  const cardPadding = isCompact ? 'p-3' : isCozy ? 'p-5' : 'p-4'
  const cardGap = isCompact ? 'gap-2' : isCozy ? 'gap-4' : 'gap-3'

  return (
    <div className={`animate-fade-in-up group relative border rounded-2xl flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 ${isStale ? 'opacity-80' : ''} ${
      bookmark.is_dead
        ? 'border-red-200 dark:border-red-900 bg-red-50/20 dark:bg-red-950/10'
        : bookmark.is_pinned
          ? 'border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-800'
          : isStale
            ? 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    }`}>
      {/* Pin badge */}
      {bookmark.is_pinned && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
          <Pin size={11} className="text-amber-500" />
        </div>
      )}

      {/* Dead link badge */}
      {bookmark.is_dead && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
          <AlertTriangle size={9} /> Dead link
        </div>
      )}

      {/* Staleness badge */}
      {isStale && !bookmark.is_dead && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
          <Clock size={9} /> Stale
        </div>
      )}

      {/* OG Image — hidden in compact, h-48 in cozy */}
      {!isCompact && bookmark.og_image ? (
        <div className={`relative ${ogHeight} bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bookmark.og_image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div
          className="h-0.5 w-full shrink-0"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />
      )}

      <div className={`${cardPadding} flex flex-col ${cardGap} flex-1`}>
        {/* Domain row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FaviconEl />
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full truncate"
              style={{ color: accentColor, background: accentBg }}
            >
              {domain}
            </span>
            <ReadingTimeBadge />
          </div>
          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
            {relativeTime(bookmark.created_at)}
          </span>
        </div>

        {/* Title */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          className="flex items-start gap-1 group/link"
        >
          <span className={`text-sm font-semibold transition-colors line-clamp-2 leading-snug group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 ${
            bookmark.is_dead
              ? 'text-slate-400 dark:text-slate-500 line-through'
              : 'text-slate-800 dark:text-slate-100'
          }`}>
            {bookmark.title}
          </span>
          <ExternalLink size={11} className="shrink-0 mt-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity text-blue-500" />
        </a>

        {/* GitHub meta */}
        <GitHubMetaDisplay bookmark={bookmark} onUpdate={onUpdate} />

        {/* Description — shown in comfortable and cozy, hidden in compact */}
        {!bookmark.github_meta && bookmark.description && !isCompact && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed -mt-1">
            {bookmark.description}
          </p>
        )}

        {/* Tags — hidden in compact */}
        {!isCompact && (bookmark.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 -mt-1">
            {(bookmark.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-0.5 text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium"
              >
                <Tag size={8} />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700 mt-auto gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
            {urlPath || '/'}
          </span>
          <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <ActionButtons />
          </div>
        </div>

        {/* Note area */}
        {showNote && <NoteArea />}
      </div>
    </div>
  )
}
