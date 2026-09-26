import type { ChantAnalyzer, ChantAnalysisInput, ChantAnalysisResult } from './types'

/**
 * Server-backed chant analyzer. The browser sends the recorded repetition and
 * known mantra reference to our own API; model credentials and heavy Vedic
 * alignment stay server-side.
 */
export class RemoteChantAnalyzer implements ChantAnalyzer {
  async analyze(input: ChantAnalysisInput): Promise<ChantAnalysisResult> {
    const form = new FormData()
    form.append('audio', input.audio, 'chant.webm')
    form.append('mantraId', input.mantraId)
    form.append('expectedText', input.expectedText)

    const response = await fetch('/api/chant-analysis', {
      method: 'POST',
      body: form,
    })

    if (!response.ok) {
      throw new Error(`Chant analysis failed (${response.status})`)
    }

    return (await response.json()) as ChantAnalysisResult
  }
}
