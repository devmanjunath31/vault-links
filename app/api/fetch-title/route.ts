import { NextRequest, NextResponse } from 'next/server'

function extractMeta(html: string, property: string): string {
  // og: property="og:image" or name="description"
  const ogMatch = html.match(
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
  )
  if (ogMatch) return ogMatch[1].trim()
  const nameMatch = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i')
  )
  return nameMatch ? nameMatch[1].trim() : ''
}

function extractMetaName(html: string, name: string): string {
  const match = html.match(
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  )
  if (match) return match[1].trim()
  const reversed = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i')
  )
  return reversed ? reversed[1].trim() : ''
}

function estimateReadingTime(html: string): number | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const wordCount = text.split(' ').filter(Boolean).length
  if (wordCount < 50) return null
  return Math.ceil(wordCount / 200)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ title: '', og_image: null, description: null, reading_time_minutes: null }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmartBookmarks/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ title: '', og_image: null, description: null, reading_time_minutes: null })
    }

    // Read first 150 KB — enough for meta tags + body word count estimation
    const buffer = await response.arrayBuffer()
    const html = new TextDecoder().decode(buffer.slice(0, 150_000))

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    const og_image = extractMeta(html, 'og:image') || null
    const description =
      extractMeta(html, 'og:description') ||
      extractMetaName(html, 'description') ||
      null

    const reading_time_minutes = estimateReadingTime(html)

    return NextResponse.json({ title, og_image, description, reading_time_minutes })
  } catch {
    return NextResponse.json({ title: '', og_image: null, description: null, reading_time_minutes: null })
  }
}
