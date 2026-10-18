import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { BANDS, Detector, type VoiceTemplate } from '../voice-count'

it.each([16000, 48000])('worklet bounds backlog to two seconds at %i Hz', rate => {
  let Processor: any
  const posted: any[] = []
  class Base { port = { onmessage: null as any, postMessage: (item: any) => posted.push(item) } }
  runInNewContext(readFileSync('public/voice-count-worklet.js', 'utf8'), {
    AudioWorkletProcessor: Base, Float32Array, currentTime: 0, sampleRate: rate,
    registerProcessor: (_: string, processor: any) => { Processor = processor },
  })
  const processor = new Processor()
  const chunk = new Float32Array(128)
  for (let i = 0; i < 10000; i++) processor.process([[chunk]])
  expect(posted).toHaveLength(1)
  expect(processor.queue.length * 1024).toBeLessThanOrEqual(rate * 2)
  processor.port.onmessage()
  expect(posted).toHaveLength(2)
})
it('unsure has a template-length cooldown and is suppressed during count refractory', () => {
  const zero = Array(BANDS).fill(0)
  const t: VoiceTemplate = { v: 1, sampleRate: 16000, bands: BANDS, frames: 40, mean: zero, std: Array(BANDS).fill(1), features: Array.from({ length: 40 }, () => [...zero]), threshold: 0.1 }
  const detector = new Detector(t)
  expect(detector.push(Array.from({ length: 40 }, () => zero))).toContainEqual({ type: 'count' })
  const almost = Array(BANDS).fill(0.03)
  expect(detector.push(Array.from({ length: 20 }, () => almost))).toEqual([])
  const positions: number[] = []
  for (let i = 0; i < 200; i++) if (detector.push([almost]).some(e => e.type === 'unsure')) positions.push(i)
  expect(positions.length).toBeGreaterThan(0)
  for (let i = 1; i < positions.length; i++) expect(positions[i] - positions[i - 1]).toBeGreaterThanOrEqual(t.frames)
})
