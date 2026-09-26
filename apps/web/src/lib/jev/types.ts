export const JEV_DECISIONS = ['ACCEPT', 'REPEAT', 'CORRECT', 'VERIFY'] as const

export type JevDecision = (typeof JEV_DECISIONS)[number]

/**
 * Signals produced by the chant-analysis layer for a single repetition.
 * Scores are normalized to the 0..1 range.
 */
export interface ChantDecisionContext {
  mantraId: string
  currentCount: number
  pronunciationScore: number
  svaraScore: number
  confidence: number
  recentMistakes: number
  recentWindow: number
  minutesSinceVerification?: number
}

export interface ChantDecisionResult {
  decision: JevDecision
  confidence: number
  source: 'jev' | 'fallback'
  reason?: string
}

export function isJevDecision(value: unknown): value is JevDecision {
  return typeof value === 'string' && JEV_DECISIONS.includes(value as JevDecision)
}
