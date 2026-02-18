'use client'

import { useState, useEffect, useCallback } from 'react'
import { ThemeContext, type Theme } from '@/context/ThemeContext'
import { createClient } from '@/lib/supabase/client'

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: Theme
  initialAccent?: string
}

function applyTheme(theme: Theme, accent: string) {
  const html = document.documentElement
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const resolved = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme
  html.setAttribute('data-theme', resolved)
  html.style.setProperty('--accent', accent)
}

export default function ThemeProvider({ children, initialTheme = 'system', initialAccent = '#3b82f6' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const [accent, setAccentState] = useState(initialAccent)

  // Apply on mount and when system preference changes
  useEffect(() => {
    applyTheme(theme, accent)

    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system', accent)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme, accent])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
    // Persist to profile (fire-and-forget)
    const supabase = createClient()
    supabase.from('profiles').update({ theme: t }).then(() => {})
  }, [])

  const setAccent = useCallback((a: string) => {
    setAccentState(a)
    localStorage.setItem('accent', a)
    const supabase = createClient()
    supabase.from('profiles').update({ accent_color: a }).then(() => {})
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}
