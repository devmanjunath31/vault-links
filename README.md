# Vault Links

> Save the web. Find it later.

A fast, private, and beautifully designed bookmark manager. Stop losing great articles in a sea of open tabs — Vault Links gives you one place to save, tag, and rediscover everything that matters.

**Live:** [vault-links-orcin.vercel.app](https://vault-links-orcin.vercel.app)
**GitHub:** [github.com/devmanjunath31/vault-links](https://github.com/devmanjunath31/vault-links)

---

## Features

### Save & Enrich
- **Auto-fetch metadata** — paste a URL and the title, OG image, description, and reading time are fetched automatically
- **Reading time estimate** — know how long an article takes before you open it
- **Smart auto-tags** — domains like GitHub, YouTube, Medium, and Reddit get tagged for you
- **URL normalization** — strips 24+ tracking parameters (UTM, fbclid, gclid, etc.) on save
- **Duplicate detection** — warns you before saving the same URL twice
- **Inline notes** — add personal notes to any bookmark, auto-saved on blur

### Organize
- **Collections** — group bookmarks into named, color-coded folders
- **Tags** — multi-tag support with chip input; press Enter or comma to add
- **Pin bookmarks** — pinned items always float to the top
- **Mark as read** — track reading progress with a visual bar in the sidebar

### Find
- **Instant search** — searches title, URL, and tags as you type
- **Command palette** (`Cmd+K`) — spotlight-style search across all bookmarks with quick actions
- **Tag filter pills** — click any tag to filter the list
- **Unread filter** — show only bookmarks you haven't read yet
- **Quick reads filter** — show only bookmarks under 5 minutes
- **Sort options** — Newest, Oldest, A→Z, Most visited, Shortest read
- **Staleness indicator** — highlights bookmarks older than 180 days you've never opened

### View & Export
- **Grid / List view** — toggle between card grid and compact list
- **Density control** — S / M / L card sizes (compact, comfortable, cozy)
- **OG image previews** — rich preview cards with cover images
- **CSV export** — download all bookmarks as a spreadsheet

### Power
- **Quick capture** (`Cmd+Shift+B`) — minimal URL save overlay, auto-closes on success
- **Weekly digest** — dismissable per-week summary of what you saved and haven't read
- **Keyboard shortcuts** — `/` focuses search, `Esc` closes modals
- **Real-time sync** — changes reflect instantly across all open tabs via Supabase Realtime

### Account & Settings
- **Google OAuth** — one-click sign-in, no password needed
- **Appearance** — light / dark / system theme, custom accent color, card density
- **Sidebar stats** — total bookmarks, read %, this week count
- **Delete account** — permanently removes all bookmarks, collections, profile, and auth record

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) — App Router, Server + Client Components |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Database & Auth | [Supabase](https://supabase.com) — PostgreSQL, RLS, Realtime |
| Auth Provider | Google OAuth via Supabase Auth |
| Language | TypeScript (strict mode) |
| Icons | [Lucide React](https://lucide.dev) |
| Deployment | [Vercel](https://vercel.com) |

---

## Project Structure

```
smart-bookmark/
├── app/
│   ├── dashboard/page.tsx        # Main dashboard (server component, fetches initial data)
│   ├── settings/page.tsx         # Settings page
│   ├── login/page.tsx            # Login page with Google OAuth
│   ├── auth/callback/route.ts    # Supabase OAuth callback handler
│   └── api/
│       ├── fetch-title/route.ts  # URL metadata + reading time fetcher
│       └── delete-account/       # Account deletion via service role key
├── components/
│   ├── DashboardClient.tsx       # Client shell — owns bookmark state + modals
│   ├── BookmarkList.tsx          # Filtered, sorted bookmark grid/list + toolbar
│   ├── BookmarkCard.tsx          # Card (density variants, notes, staleness badge)
│   ├── AddBookmarkForm.tsx       # URL save form with auto-tag + collection picker
│   ├── CollectionsSidebar.tsx    # Sticky sidebar — stats, collections, actions
│   ├── CommandPalette.tsx        # Cmd+K spotlight palette
│   ├── CaptureModal.tsx          # Cmd+Shift+B quick capture overlay
│   ├── WeeklyDigest.tsx          # Per-week dismissable digest banner
│   └── settings/                 # Profile, Appearance, Notifications panels
├── hooks/
│   ├── useBookmarks.ts           # Bookmark state + Supabase Realtime subscription
│   └── useKeyboardShortcuts.ts   # Global keyboard shortcut bindings
├── lib/
│   ├── supabase/                 # createClient (browser) + createClient (server)
│   └── url-normalize.ts          # URL normalization + domain auto-tagging map
└── types/
    ├── bookmark.ts
    ├── collection.ts
    └── profile.ts
```

---

## Architecture Notes

### Server vs Client split
Server components (`app/dashboard/page.tsx`) fetch the session and all initial data at request time — no loading spinners, instant first paint. Client components (`DashboardClient`, `BookmarkList`, `BookmarkCard`) handle interactivity, optimistic updates, and Realtime subscriptions. `useBookmarks` is lifted to `DashboardClient` so the command palette and sidebar stats can both access the full bookmark list.

### Optimistic updates
When a bookmark is saved, `AddBookmarkForm` uses `.select().single()` to get the inserted row back immediately and calls `addBookmark()` to prepend it to state — no waiting for the Realtime event. The Realtime INSERT handler deduplicates by `id`, so multi-tab sync still works without double-adding.

### RLS enforcement
Every table has Row Level Security enabled. Users can only read and write their own rows, even if the anon key is exposed in the browser.

```sql
create policy "own bookmarks" on bookmarks for all using (auth.uid() = user_id);
```

Account deletion uses the service role key (server-only API route) to bypass RLS and delete all user data before removing the auth record.

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/devmanjunath31/vault-links.git
cd vault-links
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then run this SQL:

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, avatar_url text, email text, username text, bio text,
  theme text default 'system' check (theme in ('light','dark','system')),
  accent_color text default '#3b82f6',
  notify_dead_links boolean default false,
  view_density text default 'comfortable' check (view_density in ('compact','comfortable','cozy')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now()
);

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_id uuid references collections(id) on delete set null,
  url text not null,
  title text not null,
  description text, og_image text, favicon_url text,
  tags text[] default '{}',
  notes text,
  is_read boolean default false,
  is_pinned boolean default false,
  click_count integer default 0,
  reading_time_minutes integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table collections enable row level security;
alter table bookmarks enable row level security;

create policy "own profile"     on profiles    for all using (auth.uid() = id);
create policy "own collections" on collections for all using (auth.uid() = user_id);
create policy "own bookmarks"   on bookmarks   for all using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table bookmarks;
```

### 3. Set environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

All three keys are in: Supabase Dashboard → Settings → API

### 4. Configure Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web)
2. Add your domain to Authorized JavaScript Origins and Authorized Redirect URIs (`/auth/callback`)
3. Supabase Dashboard → Authentication → Providers → Google → paste Client ID + Secret
4. Supabase Dashboard → Authentication → URL Configuration → set Site URL + add Redirect URL

### 5. Run

```bash
npm run dev
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add the three environment variables from step 3
4. Deploy, then update Google OAuth and Supabase URL config with your production URL

---

## Contributing

Open for collaboration! If Vault Links helps you, a star on GitHub means a lot.

- Bug reports → open an issue
- Feature ideas → open a discussion
- Pull requests → welcome

---

## License

MIT
