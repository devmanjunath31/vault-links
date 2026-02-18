'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Bookmark } from '@/types/bookmark'
import { Search, ExternalLink, Settings, Download, Moon, Plus, X } from 'lucide-react'

interface CommandPaletteProps {
  bookmarks: Bookmark[]
  isOpen: boolean
  onClose: () => void
  onExportCSV: () => void
  onOpenCapture: () => void
}

type ActionItem = {
  type: 'action'
  id: string
  label: string
  description: string
  icon: React.ElementType
  onExecute: () => void
}

type BookmarkItem = {
  type: 'bookmark'
  bookmark: Bookmark
}

type ListItem = ActionItem | BookmarkItem

export default function CommandPalette({ bookmarks, isOpen, onClose, onExportCSV, onOpenCapture }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const actions: ActionItem[] = useMemo(() => [
    {
      type: 'action' as const,
      id: 'capture',
      label: 'Quick capture',
      description: 'Quickly add a bookmark (⌘⇧B)',
      icon: Plus,
      onExecute: () => { onOpenCapture(); onClose() },
    },
    {
      type: 'action' as const,
      id: 'export',
      label: 'Export bookmarks as CSV',
      description: 'Download all your bookmarks',
      icon: Download,
      onExecute: () => { onExportCSV(); onClose() },
    },
    {
      type: 'action' as const,
      id: 'settings',
      label: 'Go to Settings',
      description: 'Manage profile and preferences',
      icon: Settings,
      onExecute: () => { router.push('/settings'); onClose() },
    },
    {
      type: 'action' as const,
      id: 'theme',
      label: 'Toggle dark / light mode',
      description: 'Switch the current theme',
      icon: Moon,
      onExecute: () => {
        const html = document.documentElement
        const current = html.getAttribute('data-theme') ?? 'light'
        const next = current === 'dark' ? 'light' : 'dark'
        html.setAttribute('data-theme', next)
        try { localStorage.setItem('theme', next) } catch { /* noop */ }
        onClose()
      },
    },
  ], [onClose, onExportCSV, onOpenCapture, router])

  const filteredBookmarks = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return bookmarks
      .filter((b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.tags ?? []).some((t) => t.includes(q))
      )
      .slice(0, 6)
  }, [bookmarks, query])

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions
    const q = query.toLowerCase()
    return actions.filter((a) =>
      a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    )
  }, [actions, query])

  const allItems: ListItem[] = useMemo(() => [
    ...filteredBookmarks.map((b) => ({ type: 'bookmark' as const, bookmark: b })),
    ...filteredActions,
  ], [filteredBookmarks, filteredActions])

  function executeItem(item: ListItem) {
    if (item.type === 'action') {
      item.onExecute()
    } else {
      window.open(item.bookmark.url, '_blank', 'noopener,noreferrer')
      onClose()
    }
  }

  useEffect(() => {
    if (!isOpen) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = allItems[selectedIndex]
        if (item) executeItem(item)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, allItems, selectedIndex, onClose])

  useEffect(() => setSelectedIndex(0), [query])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search bookmarks or commands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X size={14} />
            </button>
          ) : (
            <kbd className="shrink-0 text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">Esc</kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {/* Bookmarks section */}
          {filteredBookmarks.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bookmarks</div>
              {filteredBookmarks.map((bookmark, i) => {
                let domain = ''
                try { domain = new URL(bookmark.url).hostname.replace(/^www\./, '') } catch { /* noop */ }
                return (
                  <button
                    key={bookmark.id}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIndex ? 'bg-blue-50 dark:bg-blue-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => executeItem({ type: 'bookmark', bookmark })}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <ExternalLink size={13} className="shrink-0 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{bookmark.title}</div>
                      <div className="text-xs text-slate-400 truncate">{domain}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Actions section */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {query ? 'Actions' : 'Commands'}
              </div>
              {filteredActions.map((action, i) => {
                const idx = filteredBookmarks.length + i
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => executeItem(action)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Icon size={13} className="shrink-0 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{action.label}</div>
                      <div className="text-xs text-slate-400">{action.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {query && filteredBookmarks.length === 0 && filteredActions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[10px] text-slate-400">
          <span><kbd className="border border-slate-200 dark:border-slate-700 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-slate-200 dark:border-slate-700 rounded px-1">↵</kbd> select</span>
          <span><kbd className="border border-slate-200 dark:border-slate-700 rounded px-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
