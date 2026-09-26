import { requestChantDecision, type ChantDecisionRequest } from './decision'
import { normalizeChantAnalysis, type ChantAnalysisInput, type ChantAnalyzer } from './types'
import type { ChantDecisionResult } from '@/lib/jev/types'

export interface AnalyzeRepetitionInput {
  analyzer: ChantAnalyzer
  audio: Blob
  mantraId: string
  expectedText: string
  currentCount: number
  recentMistakes: number
  recentWindow: number
  minutesSinceVerification?: number
}

/**
 * Second-integration boundary: audio -> analyzer scores -> Jev decision.
 * The analyzer implementation can later be local, server-side, or a dedicated
 * Sanskrit chant model without changing the counter/Jev contract.
 */
export async function analyzeAndDecideRepetition(
  input: AnalyzeRepetitionInput
): Promise<ChantDecisionResult> {
  const analysisInput: ChantAnalysisInput = {
    audio: input.audio,
    mantraId: input.mantraId,
    expectedText: input.expectedText,
  }
  const analysis = normalizeChantAnalysis(await input.analyzer.analyze(analysisInput))
  const decisionRequest: ChantDecisionRequest = {
    mantraId: input.mantraId,
    currentCount: input.currentCount,
    analysis,
    recentMistakes: input.recentMistakes,
    recentWindow: input.recentWindow,
    minutesSinceVerification: input.minutesSinceVerification,
  }
  return requestChantDecision(decisionRequest)
}
