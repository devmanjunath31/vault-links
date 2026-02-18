'use client'

import { useEffect } from 'react'

interface ShortcutRefs {
  searchInputRef: React.RefObject<HTMLInputElement | null>
  onOpenPalette: () => void
  onOpenCapture: () => void
}

/**
 * Global keyboard shortcuts:
 *  Cmd/Ctrl+K        → open command palette
 *  Cmd/Ctrl+Shift+B  → open quick capture modal
 *  /                 → focus search (only when not already in an input)
 *  Escape            → blur focused element
 */
export function useKeyboardShortcuts({ searchInputRef, onOpenPalette, onOpenCapture }: ShortcutRefs) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName

      // Cmd/Ctrl+K — open command palette
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'k') {
        e.preventDefault()
        onOpenPalette()
        return
      }

      // Cmd/Ctrl+Shift+B — open capture modal
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        onOpenCapture()
        return
      }

      // Escape — blur whatever is focused
      if (e.key === 'Escape') {
        ;(document.activeElement as HTMLElement | null)?.blur()
        return
      }

      // "/" — focus search when not already typing
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchInputRef, onOpenPalette, onOpenCapture])
}
