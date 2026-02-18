'use client'

import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  accent: string
  setAccent: (a: string) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  accent: '#3b82f6',
  setAccent: () => {},
})
