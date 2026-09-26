import type { ChantDecisionContext, ChantDecisionResult } from './types'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

/**
 * Conservative local fallback used while Jev is unavailable or not configured.
 * This keeps the current counter usable and gives the future Jev adapter a
 * stable typed contract to implement.
 */
export function fallbackChantDecision(context: ChantDecisionContext): ChantDecisionResult {
  const pronunciation = clamp01(context.pronunciationScore)
  const svara = clamp01(context.svaraScore)
  const signalConfidence = clamp01(context.confidence)
  const mistakeRate = context.recentWindow > 0
    ? context.recentMistakes / context.recentWindow
    : 0

  if (signalConfidence < 0.55) {
    return {
      decision: 'VERIFY',
      confidence: 1 - signalConfidence,
      source: 'fallback',
      reason: 'Chant-analysis confidence is too low to accept the repetition safely.',
    }
  }

  if (pronunciation < 0.65 || svara < 0.6) {
    return {
      decision: 'REPEAT',
      confidence: clamp01(1 - Math.min(pronunciation, svara)),
      source: 'fallback',
      reason: 'Pronunciation or svara quality is below the repeat threshold.',
    }
  }

  if (mistakeRate >= 0.2 && (pronunciation < 0.8 || svara < 0.75)) {
    return {
      decision: 'CORRECT',
      confidence: clamp01(Math.max(mistakeRate, 1 - Math.min(pronunciation, svara))),
      source: 'fallback',
      reason: 'Recent repeated deviations suggest corrective feedback before continuing.',
    }
  }

  return {
    decision: 'ACCEPT',
    confidence: clamp01(Math.min(pronunciation, svara, signalConfidence)),
    source: 'fallback',
  }
}

export async function decideChantRepetition(
  context: ChantDecisionContext
): Promise<ChantDecisionResult> {
  // Jev transport is intentionally added behind this function. Until the
  // official endpoint/auth contract is configured, never expose a secret in
  // the browser and preserve existing ChantTracker behaviour via fallback.
  return fallbackChantDecision(context)
}
