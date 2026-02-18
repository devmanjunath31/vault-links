import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ title: '' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmartBookmarks/1.0)',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ title: '' })
    }

    const html = await response.text()
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = match ? match[1].trim() : ''

    return NextResponse.json({ title })
  } catch {
    return NextResponse.json({ title: '' })
  }
}
