'use client'

import { useEffect } from 'react'

interface ShortcutRefs {
  urlInputRef: React.RefObject<HTMLInputElement | null>
  searchInputRef: React.RefObject<HTMLInputElement | null>
}

/**
 * Global keyboard shortcuts:
 *  Cmd/Ctrl+K  → focus URL input (add bookmark)
 *  /           → focus search  (only when not already in an input)
 *  Escape      → blur focused element
 */
export function useKeyboardShortcuts({ urlInputRef, searchInputRef }: ShortcutRefs) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName

      // Cmd/Ctrl+K — always focus URL input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        urlInputRef.current?.focus()
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
  }, [urlInputRef, searchInputRef])
}
