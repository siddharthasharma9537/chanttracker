export interface ChantAnalysisResult {
  pronunciationScore: number
  svaraScore: number
  confidence: number
}

export interface ChantAnalysisInput {
  audio: Blob
  mantraId: string
  expectedText: string
}

export interface ChantAnalyzer {
  analyze(input: ChantAnalysisInput): Promise<ChantAnalysisResult>
}

export function normalizeChantAnalysis(result: ChantAnalysisResult): ChantAnalysisResult {
  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  return {
    pronunciationScore: clamp(result.pronunciationScore),
    svaraScore: clamp(result.svaraScore),
    confidence: clamp(result.confidence),
  }
}
