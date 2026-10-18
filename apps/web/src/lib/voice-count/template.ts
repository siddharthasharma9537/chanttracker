import { BANDS, frames } from './features'

export interface VoiceTemplate {
  v: 1
  sampleRate: number
  bands: number
  frames: number
  mean: number[]
  std: number[]
  features: number[][]
  threshold: number
}

export function normalize(feature: ArrayLike<number>, mean: number[], std: number[]) {
  return Array.from(feature, (x, i) => (x - mean[i]) / std[i])
}
export function distance(a: ArrayLike<number>, b: ArrayLike<number>) {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

/** Euclidean frame cost / warping-path length, within a 20% band. */
export function dtw(a: number[][], b: number[][]) {
  let prev = new Float64Array(b.length + 1).fill(Infinity)
  let lengths = new Uint32Array(b.length + 1)
  prev[0] = 0
  for (let i = 1; i <= a.length; i++) {
    const next = new Float64Array(b.length + 1).fill(Infinity)
    const nextLengths = new Uint32Array(b.length + 1)
    const center = i * b.length / a.length
    const band = Math.ceil(Math.max(a.length, b.length) * 0.2)
    for (let j = Math.max(1, Math.floor(center - band)); j <= Math.min(b.length, Math.ceil(center + band)); j++) {
      let cost = prev[j - 1], length = lengths[j - 1]
      if (prev[j] < cost) { cost = prev[j]; length = lengths[j] }
      if (next[j - 1] < cost) { cost = next[j - 1]; length = nextLengths[j - 1] }
      next[j] = cost + distance(a[i - 1], b[j - 1])
      nextLengths[j] = length + 1
    }
    prev = next
    lengths = nextLengths
  }
  return prev[b.length] / lengths[b.length]
}

export class CalibrationError extends Error {}

export function sampleFeatures(samples: Float32Array, sampleRate: number) {
  if (samples.length > sampleRate * 30) throw new CalibrationError('again')
  let clipped = 0
  for (const x of samples) if (Math.abs(x) >= 0.99) clipped++
  if (clipped / samples.length > 0.01) throw new CalibrationError('again')
  const all = frames(samples, sampleRate)
  const peak = Math.max(...all.map(f => f[0]))
  const gate = Math.max(Math.log(1e-6), peak - Math.log(100))
  const voiced = all.map(f => f[0] > gate)
  if (voiced.filter(Boolean).length * 0.01 < 0.4) throw new CalibrationError('again')
  const first = voiced.indexOf(true), last = voiced.lastIndexOf(true)
  const trimmed = all.slice(first, last + 1).map(f => Array.from(f))
  if (trimmed.length < 30 || trimmed.length > 800) throw new CalibrationError('length')
  return trimmed
}

export function buildTemplate(samples: Float32Array[], sampleRate: number): VoiceTemplate {
  if (samples.length < 1 || samples.length > 3) throw new CalibrationError('again')
  const sets = samples.map(s => sampleFeatures(s, sampleRate))
  const lengths = sets.map(s => s.filter(f => f[0] > Math.max(Math.log(1e-6), Math.max(...s.map(f => f[0])) - Math.log(100))).length)
  const median = [...lengths].sort((a, b) => a - b)[Math.floor(lengths.length / 2)]
  if (lengths.some(n => Math.max(n / median, median / n) > 1.6)) throw new CalibrationError('again')
  const all = sets.flat()
  const mean = Array.from({ length: BANDS }, (_, i) => all.reduce((n, f) => n + f[i], 0) / all.length)
  const std = mean.map((m, i) => Math.max(1, Math.sqrt(all.reduce((n, f) => n + (f[i] - m) ** 2, 0) / all.length)))
  const normalized = sets.map(set => set.map(f => normalize(f, mean, std)))
  const ordered = sets.map((s, i) => ({ n: s.length, i })).sort((a, b) => a.n - b.n)
  const index = ordered[Math.floor(ordered.length / 2)].i
  let largest = 0
  if (sets.length > 1) {
    for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) largest = Math.max(largest, dtw(normalized[i], normalized[j]))
  } else {
    // Fixed seed makes the single-sample threshold reproducible.
    let seed = 123456789
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296 }
    const source = samples[0]
    const rms = Math.sqrt(source.reduce((sum, x) => sum + x * x, 0) / source.length)
    for (const scale of [0.9, 1.1]) {
      const noise = Float32Array.from(source, () => random() * 2 - 1)
      const noiseRms = Math.sqrt(noise.reduce((sum, x) => sum + x * x, 0) / noise.length)
      const altered = Float32Array.from(source, (x, i) => x + noise[i] / noiseRms * rms * 0.1)
      const noisy = sampleFeatures(altered, sampleRate)
      // Stretch in feature time so tempo changes do not shift the voice's pitch.
      const stretched = Array.from({ length: Math.round(noisy.length * scale) }, (_, i) => {
        const at = Math.min(noisy.length - 1, i / scale), low = Math.floor(at), high = Math.min(noisy.length - 1, low + 1)
        return normalize(noisy[low].map((x, band) => x + (noisy[high][band] - x) * (at - low)), mean, std)
      })
      largest = Math.max(largest, dtw(normalized[0], stretched))
    }
  }
  return { v: 1, sampleRate, bands: BANDS, frames: sets[index].length, mean, std, features: normalized[index], threshold: Math.max(1e-6, 1.5 * largest) }
}

export function serialize(template: VoiceTemplate) { return JSON.stringify(template) }
export function deserialize(json: string): VoiceTemplate | null {
  try {
    if (json.length > 400000) return null
    const t = JSON.parse(json)
    const vector = (a: unknown, positive = false) => Array.isArray(a) && a.length === BANDS && a.every(x => typeof x === 'number' && Number.isFinite(x) && (!positive || x > 0))
    if (t.v !== 1 || !Number.isInteger(t.sampleRate) || t.sampleRate < 8000 || t.sampleRate > 192000 || t.bands !== BANDS || !Number.isInteger(t.frames) || t.frames < 30 || t.frames > 800 || !vector(t.mean) || !vector(t.std, true) || !Array.isArray(t.features) || t.features.length !== t.frames || !t.features.every((f: unknown) => vector(f)) || typeof t.threshold !== 'number' || !Number.isFinite(t.threshold) || t.threshold <= 0) return null
    return { v: 1, sampleRate: t.sampleRate, bands: BANDS, frames: t.frames, mean: t.mean, std: t.std, features: t.features, threshold: t.threshold }
  } catch { return null }
}
