import { NextRequest, NextResponse } from 'next/server'
import type { GitHubMeta } from '@/types/bookmark'

export async function GET(request: NextRequest) {
  const repo = request.nextUrl.searchParams.get('repo')
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return NextResponse.json(null, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        // Add 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` for higher rate limits
      },
      next: { revalidate: 3600 }, // cache for 1 hour
    })

    if (!res.ok) return NextResponse.json(null)

    const data = await res.json() as Record<string, unknown>
    const meta: GitHubMeta = {
      stars:       (data.stargazers_count as number) ?? 0,
      forks:       (data.forks_count as number) ?? 0,
      language:    (data.language as string | null) ?? null,
      description: (data.description as string | null) ?? null,
      updated_at:  (data.updated_at as string) ?? '',
    }

    return NextResponse.json(meta)
  } catch {
    return NextResponse.json(null)
  }
}
