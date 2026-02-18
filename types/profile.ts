export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  username: string | null
  bio: string | null
  theme: 'light' | 'dark' | 'system'
  accent_color: string
  notify_dead_links: boolean
  created_at: string
  updated_at: string
}
