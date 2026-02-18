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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ title: '', og_image: null, description: null }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmartBookmarks/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ title: '', og_image: null, description: null })
    }

    // Only read first 50 KB — meta tags are always in <head>
    const buffer = await response.arrayBuffer()
    const html = new TextDecoder().decode(buffer.slice(0, 50_000))

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    const og_image = extractMeta(html, 'og:image') || null
    const description =
      extractMeta(html, 'og:description') ||
      extractMetaName(html, 'description') ||
      null

    return NextResponse.json({ title, og_image, description })
  } catch {
    return NextResponse.json({ title: '', og_image: null, description: null })
  }
}
