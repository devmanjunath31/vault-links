'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, ExternalLink, Copy, Check } from 'lucide-react'
import type { Bookmark } from '@/types/bookmark'

interface BookmarkCardProps {
  bookmark: Bookmark
  onDelete: (id: string) => void
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
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  let domain = ''
  try {
    domain = new URL(bookmark.url).hostname.replace(/^www\./, '')
  } catch {
    domain = ''
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable (non-https or denied)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    onDelete(bookmark.id)

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmark.id)

    if (error) {
      console.error('Delete error:', error.message)
      setIsDeleting(false)
    }
  }

  return (
    <div className="animate-fade-in-up bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 hover:border-slate-300 hover:shadow-md transition-all duration-150 group">
      {/* Favicon */}
      <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt=""
          width={18}
          height={18}
          onError={(e) => {
            const el = e.target as HTMLImageElement
            el.style.display = 'none'
            const parent = el.parentElement
            if (parent) {
              parent.innerHTML = `<span style="font-size:13px;font-weight:600;color:#64748b">${(domain[0] ?? '?').toUpperCase()}</span>`
            }
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 min-w-0 group/link"
        >
          <span className="truncate text-sm font-medium text-slate-900 group-hover/link:text-blue-600 transition-colors">
            {bookmark.title}
          </span>
          <ExternalLink
            size={11}
            className="shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity text-blue-500"
          />
        </a>

        <div className="flex items-center gap-2 mt-1">
          {domain && (
            <span className="text-xs text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 font-mono leading-none">
              {domain}
            </span>
          )}
          <span className="text-xs text-slate-400">{relativeTime(bookmark.created_at)}</span>
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {/* Copy URL */}
        <button
          onClick={handleCopy}
          className={`p-2 rounded-lg transition-all active:scale-95 ${
            copied
              ? 'text-emerald-500 bg-emerald-50'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Copy URL"
          title={copied ? 'Copied!' : 'Copy URL'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 active:scale-95"
          aria-label="Delete bookmark"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
