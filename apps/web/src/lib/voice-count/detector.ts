import { distance, normalize, type VoiceTemplate } from './template'

export type CountEvent = { type: 'count' | 'unsure' }

export class Detector {
  private window: number[][] = []
  private position = 0
  private consumed = 0
  private refractoryUntil = 0
  private unsureAt = -Infinity
  constructor(readonly template: VoiceTemplate) {}
  reset() {
    this.window = []
    this.position = this.consumed = this.refractoryUntil = 0
    this.unsureAt = -Infinity
  }
  get retainedFrames() { return this.window.length }
  push(features: ArrayLike<number>[]): CountEvent[] {
    const events: CountEvent[] = []
    const n = this.template.frames, max = Math.floor(n * 1.3)
    for (const frame of features) {
      this.position++
      this.window.push(normalize(frame, this.template.mean, this.template.std))
      if (this.window.length > max) this.window.shift()
      if (this.position % 5 || this.position < this.refractoryUntil || this.window.length < n * 0.7) continue
      const score = this.match()
      if (score < this.template.threshold) {
        events.push({ type: 'count' })
        this.consumed = this.position
        this.refractoryUntil = this.position + Math.ceil(n * 0.6)
        this.window = []
      } else if (score < this.template.threshold * 1.3 && this.position - this.unsureAt >= n) {
        events.push({ type: 'unsure' })
        this.unsureAt = this.position
      }
    }
    return events
  }
  /** Subsequence DTW; free starts, bounded duration, 20% Sakoe-Chiba band. */
  private match() {
    const a = this.template.features, b = this.window, n = a.length, m = b.length
    let prev = new Float64Array(m + 1)
    let lengths = new Uint32Array(m + 1)
    let starts = Int32Array.from({ length: m + 1 }, (_, i) => i)
    const band = Math.ceil(n * 0.2)
    for (let i = 1; i <= n; i++) {
      const next = new Float64Array(m + 1).fill(Infinity)
      const lens = new Uint32Array(m + 1), from = new Int32Array(m + 1)
      for (let j = 1; j <= m; j++) {
        let cost = prev[j - 1], length = lengths[j - 1], start = starts[j - 1]
        if (prev[j] < cost) { cost = prev[j]; length = lengths[j]; start = starts[j] }
        if (next[j - 1] < cost) { cost = next[j - 1]; length = lens[j - 1]; start = from[j - 1] }
        if (Math.abs(i - (j - start)) > band || this.position - m + start < this.consumed) continue
        next[j] = cost + distance(a[i - 1], b[j - 1])
        lens[j] = length + 1
        from[j] = start
      }
      prev = next; lengths = lens; starts = from
    }
    const duration = m - starts[m]
    return duration >= n * 0.7 && duration <= n * 1.3 ? prev[m] / lengths[m] : Infinity
  }
}
