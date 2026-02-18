export interface GitHubMeta {
  stars: number
  forks: number
  language: string | null
  description: string | null
  updated_at: string
}

export interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string
  favicon_url: string | null
  og_image: string | null
  description: string | null
  is_pinned: boolean
  is_read: boolean
  click_count: number
  tags: string[]
  collection_id: string | null
  github_meta: GitHubMeta | null
  is_dead: boolean
  last_checked_at: string | null
  reading_time_minutes: number | null
  notes: string | null
  created_at: string
}
