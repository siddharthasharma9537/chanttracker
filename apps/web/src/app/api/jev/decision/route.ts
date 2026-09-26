import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fallbackChantDecision } from '@/lib/jev/decide'
import { isJevDecision, type ChantDecisionResult } from '@/lib/jev/types'

const ContextSchema = z.object({
  mantraId: z.string().min(1),
  currentCount: z.number().int().nonnegative(),
  pronunciationScore: z.number().min(0).max(1),
  svaraScore: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  recentMistakes: z.number().int().nonnegative(),
  recentWindow: z.number().int().nonnegative(),
  minutesSinceVerification: z.number().nonnegative().optional(),
})

const CHOICE_CRITERIA = {
  ACCEPT: 'Accept this repetition and increment the chant count.',
  REPEAT: 'Do not increment; ask the chanter to repeat the current repetition.',
  CORRECT: 'Pause counting and give corrective pronunciation or svara feedback.',
  VERIFY: 'Pause normal counting and trigger the verification flow.',
}

export async function POST(request: Request) {
  const parsed = ContextSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chant decision context' }, { status: 400 })
  }

  const context = parsed.data
  const apiKey = process.env.TYPESAFE_API_KEY

  if (!apiKey) {
    return NextResponse.json(fallbackChantDecision(context))
  }

  try {
    const response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.TYPESAFE_JEV_MODEL ?? 'jev-latest',
        state: context,
        questions: {
          chant_action: {
            type: 'choice',
            instructions:
              'Choose the safest next ChantTracker action for this single mantra repetition. Prefer ACCEPT when the evidence is clearly good; otherwise choose the action that preserves count integrity.',
            criteria: CHOICE_CRITERIA,
          },
        },
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(fallbackChantDecision(context))
    }

    const payload = (await response.json()) as {
      answers?: {
        chant_action?: {
          choice?: unknown
          confidence?: unknown
        }
      }
    }
    const answer = payload.answers?.chant_action

    if (!answer || !isJevDecision(answer.choice)) {
      return NextResponse.json(fallbackChantDecision(context))
    }

    const result: ChantDecisionResult = {
      decision: answer.choice,
      confidence: typeof answer.confidence === 'number' ? answer.confidence : 0,
      source: 'jev',
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(fallbackChantDecision(context))
  }
}
