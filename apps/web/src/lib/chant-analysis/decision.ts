import type { ChantDecisionContext, ChantDecisionResult } from '@/lib/jev/types'
import type { ChantAnalysisResult } from './types'

export interface ChantDecisionRequest {
  mantraId: string
  currentCount: number
  analysis: ChantAnalysisResult
  recentMistakes: number
  recentWindow: number
  minutesSinceVerification?: number
}

export async function requestChantDecision(
  request: ChantDecisionRequest
): Promise<ChantDecisionResult> {
  const context: ChantDecisionContext = {
    mantraId: request.mantraId,
    currentCount: request.currentCount,
    pronunciationScore: request.analysis.pronunciationScore,
    svaraScore: request.analysis.svaraScore,
    confidence: request.analysis.confidence,
    recentMistakes: request.recentMistakes,
    recentWindow: request.recentWindow,
    minutesSinceVerification: request.minutesSinceVerification,
  }

  const response = await fetch('/api/jev/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  })

  if (!response.ok) {
    throw new Error(`Chant decision failed (${response.status})`)
  }

  return (await response.json()) as ChantDecisionResult
}
