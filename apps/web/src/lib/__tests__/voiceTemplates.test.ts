import { afterEach, expect, it, vi } from 'vitest'
import { forget, load, save } from '../voiceTemplates'
import { readFileSync } from 'node:fs'
import { buildTemplate } from '../voice-count'
afterEach(() => vi.unstubAllGlobals())
it('discards malformed storage and tolerates unavailable storage', () => {
  const removeItem = vi.fn()
  vi.stubGlobal('localStorage', { getItem: () => '{"v":2}', removeItem })
  expect(load('a')).toBeNull()
  expect(removeItem).toHaveBeenCalledWith('voiceTemplate:v1:a')
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error() }, setItem: () => { throw new Error() }, removeItem: () => { throw new Error() } })
  expect(load('a')).toBeNull()
  const pcm = Float32Array.from({ length: 16000 }, (_, i) => Math.sin(i / 10) * 0.1)
  expect(() => save('a', buildTemplate([pcm], 16000))).not.toThrow()
  expect(() => forget('a')).not.toThrow()
})
it('V8 mixed session mapping, freeze before saving, and retry invariants (code-level)', () => {
  const counter = readFileSync('src/components/practice/Counter.tsx', 'utf8')
  const mapping = counter.match(/method: (e.isMain && frozenCounts.voice \? 'voice_count' : 'tap')/)![1]
  const method = new Function('e', 'frozenCounts', `return ${mapping}`)
  expect(method({ isMain: true }, { voice: false })).toBe('tap')
  expect(method({ isMain: true }, { voice: true })).toBe('voice_count')
  expect(method({ isMain: false }, { voice: true })).toBe('tap')
  expect(counter).toContain("useState<'tap' | 'voice'>('tap')")
  expect(counter).toContain('const frozenCounts = snapshot.current!')
  expect(counter).toContain('if (saved || snapshot.current) return')
  const finish = counter.slice(counter.indexOf('  const finish ='))
  expect(finish.indexOf('snapshot.current =')).toBeLessThan(finish.indexOf('voice.stop()'))
  expect(finish.indexOf('voice.stop()')).toBeLessThan(finish.indexOf('save.mutate()'))
  expect(counter).toContain('if (written.current.has(e.mantraId)) continue')
})
