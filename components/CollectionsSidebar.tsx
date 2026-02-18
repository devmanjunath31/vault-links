'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Collection } from '@/types/collection'
import { Plus, Trash2, Folder, BookOpen, Inbox } from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface CollectionsSidebarProps {
  collections: Collection[]
  activeCollectionId: string | null
  onSelect: (id: string | null) => void
}

export default function CollectionsSidebar({
  collections,
  activeCollectionId,
  onSelect,
}: CollectionsSidebarProps) {
  const [localCollections, setLocalCollections] = useState<Collection[]>(collections)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSaving(false); return }

    const { data, error } = await supabase
      .from('collections')
      .insert({ name, color: newColor, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setLocalCollections((prev) => [...prev, data as Collection])
    }
    setNewName('')
    setNewColor(PRESET_COLORS[0])
    setIsAdding(false)
    setIsSaving(false)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setLocalCollections((prev) => prev.filter((c) => c.id !== id))
    if (activeCollectionId === id) onSelect(null)
    await supabase.from('collections').delete().eq('id', id)
  }

  const navItem = (
    id: string | null,
    label: string,
    Icon: React.ElementType,
    color?: string
  ) => {
    const active = activeCollectionId === id
    return (
      <button
        key={id ?? 'all'}
        onClick={() => onSelect(id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group/item ${
          active
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Icon
          size={14}
          className="shrink-0"
          style={color ? { color } : undefined}
        />
        <span className="truncate grow text-left">{label}</span>
      </button>
    )
  }

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-1">
        Library
      </p>

      {navItem(null, 'All Bookmarks', Inbox)}
      {navItem('reading', 'Reading List', BookOpen)}

      <div className="my-2 border-t border-slate-100" />

      <div className="flex items-center justify-between px-3 mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Collections
        </p>
        <button
          onClick={() => setIsAdding(true)}
          className="text-slate-400 hover:text-blue-600 transition-colors"
          title="New collection"
        >
          <Plus size={13} />
        </button>
      </div>

      {localCollections.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group/item ${
            activeCollectionId === c.id
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Folder size={14} className="shrink-0" style={{ color: c.color }} />
          <span className="truncate grow text-left">{c.name}</span>
          <Trash2
            size={12}
            className="shrink-0 opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition-all"
            onClick={(e) => handleDelete(c.id, e)}
          />
        </button>
      ))}

      {/* Inline add form */}
      {isAdding && (
        <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
          />
          {/* Color swatches */}
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  newColor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleAdd}
              disabled={isSaving || !newName.trim()}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {isSaving ? 'Saving…' : 'Add'}
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
