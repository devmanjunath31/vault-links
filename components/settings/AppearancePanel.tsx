'use client'

import { useTheme } from '@/hooks/useTheme'
import type { Theme } from '@/context/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'

const ACCENT_PRESETS = [
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Pink',   value: '#ec4899' },
  { label: 'Rose',   value: '#f43f5e' },
  { label: 'Amber',  value: '#f59e0b' },
  { label: 'Emerald',value: '#10b981' },
  { label: 'Teal',   value: '#14b8a6' },
]

const THEMES: { id: Theme; label: string; Icon: React.ElementType }[] = [
  { id: 'light',  label: 'Light',  Icon: Sun },
  { id: 'dark',   label: 'Dark',   Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
]

export default function AppearancePanel() {
  const { theme, setTheme, accent, setAccent } = useTheme()

  return (
    <div className="space-y-8 max-w-lg">
      {/* Theme */}
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                theme === id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl ${theme === id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                <Icon size={18} />
              </div>
              <span className={`text-xs font-medium ${theme === id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Accent color</p>

        {/* Preview strip */}
        <div className="h-2 rounded-full mb-4" style={{ background: accent }} />

        <div className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setAccent(value)}
              title={label}
              className={`w-9 h-9 rounded-full transition-transform hover:scale-110 ${
                accent === value ? 'scale-125 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''
              }`}
              style={{ background: value }}
            />
          ))}

          {/* Custom color picker */}
          <label
            className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors overflow-hidden"
            title="Custom color"
          >
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="opacity-0 w-0 h-0 absolute"
            />
            <span className="text-slate-400 text-xs font-mono">+</span>
          </label>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          Applied to links, buttons, and interactive elements.
        </p>
      </div>
    </div>
  )
}
