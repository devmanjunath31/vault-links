# Smart Bookmarks

A production-quality bookmark manager built with Next.js 16 and Supabase.

**Live demo:** _[add your Vercel URL here]_

---

## Tech Stack

- **Next.js 16** (App Router, Server Components)
- **Supabase** (`@supabase/ssr` for session management)
- **Tailwind CSS v4**
- **TypeScript** (strict mode)
- **Lucide React** (icons)

---

## Local Setup

```bash
git clone <your-repo-url>
cd smart-bookmark

# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

---

## Architecture

### Server vs Client Component Split

- **Server Components** (`app/page.tsx`, `app/dashboard/page.tsx`): fetch session and initial data at request time — no loading spinners, instant first paint.
- **Client Components** (`BookmarkList`, `AddBookmarkForm`, `BookmarkCard`, `UserAvatar`): handle interactivity, form state, realtime subscriptions, and optimistic UI.
- Initial bookmark data flows from the server → `BookmarkList` as props, so the page renders fully on first load without a client-side fetch.

### How RLS Enforces Bookmark Privacy

Supabase Row Level Security policies ensure every DB query is scoped to the authenticated user:

```sql
CREATE POLICY "select_own" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own" ON bookmarks FOR DELETE USING (auth.uid() = user_id);
```

Even if the anon key is exposed in the browser, users can only ever read/write their own rows.

### How Supabase Realtime Works Here

`BookmarkList` subscribes to `postgres_changes` on the `bookmarks` table, filtered by `user_id`:

```ts
supabase.channel('bookmarks-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookmarks',
    filter: `user_id=eq.${userId}`,
  }, handler)
  .subscribe()
```

On `INSERT`, the new bookmark is prepended to state. On `DELETE`, it's removed. The filter prevents receiving another user's events.

### Why `@supabase/ssr` Over Legacy Packages

`@supabase/auth-helpers` had limitations with the Next.js App Router — it couldn't correctly read/write cookies in Server Components and middleware simultaneously. `@supabase/ssr` is the official replacement: it exposes `getAll`/`setAll` cookie callbacks that integrate cleanly with both `next/headers` (server side) and `NextRequest`/`NextResponse` (middleware), keeping the session in sync across the full request lifecycle.

---

## Problems I Ran Into

### Supabase session not persisting in App Router

**Problem:** After OAuth login, the session cookie wasn't being passed to Server Components — `getUser()` always returned `null`.

**Fix:** `@supabase/ssr` + middleware that reads cookies from the request AND writes them back on the response. The key is that middleware must both spread `request.cookies` into the Supabase client AND call `supabaseResponse.cookies.set(...)` for every cookie update.

### Realtime not firing

**Problem:** Added a realtime subscription but INSERT/DELETE events never arrived.

**Fix:** Realtime is off by default per-table. Go to **Database → Replication** in the Supabase dashboard and toggle replication on for the `bookmarks` table.

### Google OAuth redirect URI mismatch

**Problem:** OAuth worked locally but returned a `redirect_uri_mismatch` error after deploying to Vercel.

**Fix:** Add the production URL to two places:
1. **Google Cloud Console** → Credentials → OAuth 2.0 Client → Authorized redirect URIs → add `https://your-app.vercel.app/auth/callback`
2. **Supabase** → Authentication → URL Configuration → add `https://your-app.vercel.app` to Site URL and Redirect URLs

---

## Vercel Deployment

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — note your production URL (e.g. `https://your-app.vercel.app`)
5. Add `https://your-app.vercel.app/auth/callback` to Google Cloud Console OAuth redirect URIs
6. Add `https://your-app.vercel.app` to Supabase → Authentication → URL Configuration

---

## If I Had More Time

- **Bookmark folders / collections** — group bookmarks by topic with drag-and-drop ordering
- **Browser extension** — one-click bookmarking from any page without opening the app
- **Bulk import** — import from Chrome/Firefox bookmarks HTML export
- **Search** — full-text search across titles and URLs, powered by Postgres `tsvector`
