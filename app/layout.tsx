import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/profile'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vault Links',
  description: 'Save and organize the web, your way.',
}

// Inline script that runs before paint — eliminates theme flash
const themeScript = `
(function(){try{
  var t=localStorage.getItem('theme')||'system';
  var a=localStorage.getItem('accent')||'#3b82f6';
  var dark=(t==='dark')||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.setAttribute('data-theme',dark?'dark':'light');
  document.documentElement.style.setProperty('--accent',a);
}catch(e){}})();
`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch theme prefs server-side to pass as initial values to ThemeProvider
  let initialTheme: Profile['theme'] = 'system'
  let initialAccent = '#3b82f6'

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('theme, accent_color')
        .eq('id', user.id)
        .single()
      if (profile) {
        initialTheme = profile.theme ?? 'system'
        initialAccent = profile.accent_color ?? '#3b82f6'
      }
    }
  } catch {
    // unauthenticated or DB error — use defaults
  }

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Must be first script in head — eliminates flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} h-full`}>
        <ThemeProvider initialTheme={initialTheme} initialAccent={initialAccent}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
