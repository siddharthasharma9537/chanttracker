import { NextResponse } from 'next/server'

// The real SoHum Jyotisha panchangam service (Swiss-Lahiri computed, works
// for any date/location) -- see sohum-panchangam-app/src/api/client.ts,
// the mobile app that already consumes this exact endpoint. Proxied
// server-side so a future shared-identity token (SOHUM_VANI_CONTRACT.md §1,
// not yet decided) has one place to be added without a client rebuild.
const SOHUM_PANCHANGAM_API_URL =
  process.env.SOHUM_PANCHANGAM_API_URL ?? 'https://panchangam-eight.vercel.app'

// Cheruvugattu (Narketpally) -- the same default location used across the
// SoHum suite (sohum-panchangam-app/src/api/client.ts's CHERUVUGATTU).
const DEFAULT_LATITUDE = 17.19
const DEFAULT_LONGITUDE = 78.61

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  if (!date) {
    return NextResponse.json({ error: 'date query param is required' }, { status: 400 })
  }
  const latitude = searchParams.get('latitude') ?? String(DEFAULT_LATITUDE)
  const longitude = searchParams.get('longitude') ?? String(DEFAULT_LONGITUDE)

  const upstream = new URL('/v1/panchangam', SOHUM_PANCHANGAM_API_URL)
  upstream.searchParams.set('date', date)
  upstream.searchParams.set('latitude', latitude)
  upstream.searchParams.set('longitude', longitude)

  try {
    const res = await fetch(upstream, { next: { revalidate: 3600 } })
    if (!res.ok) {
      return NextResponse.json(
        { error: `SoHum panchangam API error (${res.status})` },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'SoHum panchangam API unreachable' }, { status: 502 })
  }
}
