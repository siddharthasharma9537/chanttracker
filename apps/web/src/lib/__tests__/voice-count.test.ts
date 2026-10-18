import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildTemplate, deserialize, Detector, FeatureStream, frames, serialize, sampleFeatures } from '../voice-count'

function random(seed: number) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296 }
}
function phrase(rate: number, scale = 1, pattern = [320, 740, 1600]) {
  const pcm = new Float32Array(Math.round(rate * 1.2 * scale))
  for (let i = 0; i < pcm.length; i++) {
    const t = i / rate / scale, section = Math.min(2, Math.floor(t / 0.4)), local = t % 0.4
    if (local < 0.32) pcm[i] = 0.3 * Math.sin(2 * Math.PI * pattern[section] * i / rate) * Math.min(1, local / 0.015, (0.32 - local) / 0.015)
  }
  return pcm
}
function noise(pcm: Float32Array, rng: () => number, rms?: number) {
  const signalRms = rms ?? Math.sqrt(pcm.reduce((sum, x) => sum + x * x, 0) / pcm.length)
  const raw = Float32Array.from(pcm, () => rng() * 2 - 1)
  const rawRms = Math.sqrt(raw.reduce((sum, x) => sum + x * x, 0) / raw.length)
  return Float32Array.from(pcm, (x, i) => x + raw[i] / rawRms * signalRms * 0.1)
}
function run(rate: number, parts: Float32Array[], template = buildTemplate([phrase(rate)], rate), chunkSize = 4096) {
  const detector = new Detector(template), framer = new FeatureStream(rate)
  let counts = 0
  for (const part of parts) {
    for (let i = 0; i < part.length; i += chunkSize) {
      counts += detector.push(framer.push(part.subarray(i, i + chunkSize))).filter(e => e.type === 'count').length
    }
  }
  return counts
}

describe.each([16000, 48000])('synthetic acceptance at %i Hz', rate => {
  for (const seed of [7, 41, 2026]) {
    it(`V1/V2 tempo, gaps and −20 dB RMS noise, seed ${seed}`, () => {
      for (const jitter of [0.15, 0.3]) {
        const rng = random(seed), parts: Float32Array[] = []
        for (let i = 0; i < 108; i++) {
          parts.push(noise(phrase(rate, 1 + (rng() * 2 - 1) * jitter), rng))
          parts.push(noise(new Float32Array(Math.round(rate * (0.2 + rng() * 0.4))), rng, 0.18))
        }
        const count = run(rate, parts)
        if (jitter === 0.15) expect(count).toBeGreaterThanOrEqual(106)
        expect(count).toBeLessThanOrEqual(jitter === 0.15 ? 110 : 108)
      }
    })
    it(`V3/V4/V5 negatives, seed ${seed}`, () => {
      const rng = random(seed)
      expect(run(rate, [new Float32Array(rate * 60), noise(new Float32Array(rate * 60), rng, 0.2)])).toBe(0)
      const coughs = Array.from({ length: 20 }, () => [phrase(rate).slice(0, rate * 0.15), new Float32Array(rate / 2)]).flat()
      expect(run(rate, coughs)).toBe(0)
      const other = Array.from({ length: 50 }, () => [noise(phrase(rate, 1, [1600, 740, 320]), rng), new Float32Array(rate / 3)]).flat()
      expect(run(rate, other)).toBeLessThanOrEqual(2)
    })
  }
  it('back-to-back repetitions and partial phrases', () => {
    expect(run(rate, Array.from({ length: 12 }, () => phrase(rate)))).toBe(12)
    expect(run(rate, [phrase(rate).slice(0, rate * 0.6), new Float32Array(rate * 2)])).toBe(0)
  })
  it('continuous features and counts at chunk sizes 128, 1000, 4096', () => {
    const pcm = phrase(rate), expected = frames(pcm, rate)
    for (const size of [128, 1000, 4096]) {
      const stream = new FeatureStream(rate)
      const actual = []
      for (let i = 0; i < pcm.length; i += size) actual.push(...stream.push(pcm.subarray(i, i + size)))
      expect(actual).toEqual(expected)
      expect(stream.retainedSamples).toBeLessThan(rate * 0.025)
      expect(run(rate, [pcm, pcm, pcm], undefined, size)).toBe(3)
    }
  })
})

it('V6 JSON round trip, strict schema, and calibration rejection', () => {
  const t = buildTemplate([phrase(16000)], 16000)
  expect(deserialize(serialize(t))).toEqual(t)
  expect(Object.keys(t).sort()).toEqual(['v', 'sampleRate', 'bands', 'frames', 'mean', 'std', 'features', 'threshold'].sort())
  const arrays = (value: unknown): number[] => Array.isArray(value) ? [value.length, ...value.flatMap(arrays)] : []
  expect(Math.max(...arrays(Object.values(t)))).toBeLessThanOrEqual(t.frames * t.bands)
  for (const value of [{ ...t, v: 2 }, { ...t, frames: 801 }, { ...t, std: t.std.map(() => 0) }, { ...t, mean: [1] }, { ...t, features: [[1]] }, { ...t, threshold: null }, null]) expect(deserialize(JSON.stringify(value))).toBeNull()
  expect(deserialize('{')).toBeNull()
  expect(() => sampleFeatures(new Float32Array(16000), 16000)).toThrow()
  expect(() => sampleFeatures(new Float32Array(16000).fill(1), 16000)).toThrow()
  expect(() => sampleFeatures(new Float32Array(16000 * 31), 16000)).toThrow()
  expect(() => buildTemplate([phrase(16000), phrase(16000, 2)], 16000)).toThrow()
  expect(() => buildTemplate([phrase(16000), phrase(16000, 1.05), phrase(16000, 0.95)], 16000)).not.toThrow()
})

it('V7 engine privacy guard', () => {
  const folder = resolve('src/lib/voice-count')
  for (const name of readdirSync(folder)) expect(readFileSync(resolve(folder, name), 'utf8')).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|supabase|MediaRecorder|localStorage|indexedDB/)
})

it('30-minute stream keeps a bounded working set and suppresses repeat events', () => {
  const template = buildTemplate([phrase(16000)], 16000)
  const detector = new Detector(template)
  // Feature-domain stream isolates the detector working set from FFT cost.
  const silent = frames(new Float32Array(16000), 16000)[0]
  const batch = Array.from({ length: 100 }, () => silent)
  for (let second = 0; second < 30 * 60; second++) {
    expect(detector.push(batch)).toEqual([])
    expect(detector.retainedFrames).toBeLessThanOrEqual(Math.floor(template.frames * 1.3))
  }
})
