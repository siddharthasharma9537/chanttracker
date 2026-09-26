import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_AUDIO_BYTES = 8 * 1024 * 1024

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== 'undefined' && value instanceof File
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const audio = form.get('audio')
    const mantraId = form.get('mantraId')
    const expectedText = form.get('expectedText')

    if (!isFile(audio) || typeof mantraId !== 'string' || typeof expectedText !== 'string') {
      return NextResponse.json({ error: 'audio, mantraId and expectedText are required' }, { status: 400 })
    }

    if (!expectedText.trim() || !mantraId.trim()) {
      return NextResponse.json({ error: 'mantraId and expectedText cannot be empty' }, { status: 400 })
    }

    if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'audio must be between 1 byte and 8 MB' }, { status: 413 })
    }

    const serviceUrl = process.env.CHANT_ANALYSIS_URL
    if (!serviceUrl) {
      return NextResponse.json(
        { error: 'Chant analysis service is not configured' },
        { status: 503 }
      )
    }

    const upstream = new FormData()
    upstream.append('audio', audio, audio.name || 'chant.webm')
    upstream.append('mantraId', mantraId)
    upstream.append('expectedText', expectedText)

    const headers: HeadersInit = {}
    const serviceKey = process.env.CHANT_ANALYSIS_API_KEY
    if (serviceKey) headers.Authorization = `Bearer ${serviceKey}`

    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers,
      body: upstream,
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Chant analysis service failed' },
        { status: 502 }
      )
    }

    const result = await response.json() as Record<string, unknown>
    const pronunciationScore = Number(result.pronunciationScore)
    const svaraScore = Number(result.svaraScore)
    const confidence = Number(result.confidence)

    if (![pronunciationScore, svaraScore, confidence].every(Number.isFinite)) {
      return NextResponse.json(
        { error: 'Chant analysis service returned an invalid score payload' },
        { status: 502 }
      )
    }

    const clamp = (value: number) => Math.max(0, Math.min(1, value))
    return NextResponse.json({
      pronunciationScore: clamp(pronunciationScore),
      svaraScore: clamp(svaraScore),
      confidence: clamp(confidence),
    })
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    return NextResponse.json(
      { error: timedOut ? 'Chant analysis timed out' : 'Unable to analyze chant' },
      { status: timedOut ? 504 : 500 }
    )
  }
}
