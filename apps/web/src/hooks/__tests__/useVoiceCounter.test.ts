import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const harness = vi.hoisted(() => ({ refs: [] as { current: any }[], cleanups: [] as (() => void)[], index: 0, states: [] as any[] }))
vi.mock('react', () => ({
  useRef: (value: any) => harness.refs[harness.index++] ?? (harness.refs[harness.index - 1] = { current: value }),
  useState: (value: any) => [value, (next: any) => harness.states.push(next)],
  useCallback: (fn: any) => fn,
  useEffect: (fn: () => (() => void)) => harness.cleanups.push(fn()),
}))
import { useVoiceCounter } from '../useVoiceCounter'
import { buildTemplate } from '../../lib/voice-count'

let resolveMedia: (value: any) => void
let hidden: () => void
let track: { stop: ReturnType<typeof vi.fn>; onended: (() => void) | null }
let audio: FakeAudio
let worklet: FakeWorklet
const onEvent = vi.fn(), onListening = vi.fn()
class FakeAudio {
  state = 'running'
  sampleRate = 16000
  currentTime = 0
  destination = {}
  onstatechange: (() => void) | null = null
  get audioWorklet() { return { addModule: vi.fn().mockResolvedValue(undefined) } }
  close = vi.fn().mockResolvedValue(undefined)
  resume = vi.fn().mockResolvedValue(undefined)
  createMediaStreamSource = () => ({ connect: vi.fn(), disconnect: vi.fn() })
  constructor() { audio = this }
}
class FakeWorklet {
  port = { onmessage: null as any, postMessage: vi.fn() }
  connect = vi.fn()
  disconnect = vi.fn()
  constructor() { worklet = this }
}
function storedTemplate() {
  const pcm = Float32Array.from({ length: 16000 }, (_, i) => 0.2 * Math.sin(2 * Math.PI * (i < 8000 ? 300 : 900) * i / 16000))
  return JSON.stringify(buildTemplate([pcm], 16000))
}
beforeEach(() => {
  harness.refs = []; harness.cleanups = []; harness.index = 0; harness.states = []
  track = { stop: vi.fn(), onended: null }
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn(() => new Promise(resolve => { resolveMedia = resolve })) } })
  vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: (_: string, fn: () => void) => { hidden = fn }, removeEventListener: vi.fn() })
  vi.stubGlobal('AudioContext', FakeAudio)
  vi.stubGlobal('AudioWorkletNode', FakeWorklet)
  vi.stubGlobal('localStorage', { getItem: vi.fn(() => storedTemplate()), setItem: vi.fn(), removeItem: vi.fn() })
  vi.clearAllMocks()
})
afterEach(() => { for (const cleanup of harness.cleanups) cleanup(); vi.unstubAllGlobals() })

for (const action of ['stop', 'hide', 'unmount'] as const) it(`discards permission resolving after ${action}`, async () => {
  const hook = useVoiceCounter('mantra', onEvent, onListening)
  const pending = hook.start()
  if (action === 'stop') hook.stop()
  if (action === 'hide') { (document as any).visibilityState = 'hidden'; hidden() }
  if (action === 'unmount') harness.cleanups[0]()
  resolveMedia({ getTracks: () => [track] })
  await pending
  expect(track.stop).toHaveBeenCalled()
  expect(onListening).not.toHaveBeenCalled()
})

it('stops tracks, context, queued events on hide and never auto-resumes', async () => {
  const hook = useVoiceCounter('mantra', onEvent, onListening)
  const pending = hook.start()
  resolveMedia({ getTracks: () => [track] })
  await pending
  expect(onListening).toHaveBeenCalledOnce()
  const queued = worklet.port.onmessage
  ;(document as any).visibilityState = 'hidden'
  hidden()
  queued({ data: { pcm: new Float32Array(1024), time: 0 } })
  expect(track.stop).toHaveBeenCalledOnce()
  expect(audio.close).toHaveBeenCalledOnce()
  expect(onEvent).not.toHaveBeenCalled()
  ;(document as any).visibilityState = 'visible'
  hidden()
  expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce()
  expect(harness.states).toContain('paused-hidden')
})

it.each(['track', 'context'])('%s end stops capture', async end => {
    const hook = useVoiceCounter('mantra', onEvent, onListening)
    const pending = hook.start()
    resolveMedia({ getTracks: () => [track] })
    await pending
    if (end === 'track') track.onended!()
    else { audio.state = 'interrupted'; audio.onstatechange!() }
    expect(harness.states.at(-1)).toBe('paused-hidden')
    expect(audio.close).toHaveBeenCalled()
})

it('denial and unsupported browsers fall back without capture', async () => {
  const hook = useVoiceCounter('mantra', onEvent, onListening)
  vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce({ name: 'NotAllowedError' })
  await hook.start()
  expect(harness.states).toContain('denied')
  vi.stubGlobal('AudioWorkletNode', undefined)
  await hook.start()
  expect(harness.states).toContain('error')
  expect(onListening).not.toHaveBeenCalled()
})

it('one good calibration sample finishes, clears PCM, and starts listening', async () => {
  vi.mocked(localStorage.getItem).mockReturnValue(null)
  const hook = useVoiceCounter('mantra', onEvent, onListening)
  const pending = hook.start()
  resolveMedia({ getTracks: () => [track] })
  await pending
  expect(harness.states).toContain('calibrating')
  const pcm = Float32Array.from({ length: 16000 }, (_, i) => 0.2 * Math.sin(2 * Math.PI * (i < 8000 ? 300 : 900) * i / 16000))
  worklet.port.onmessage({ data: { pcm, time: 0 } })
  hook.done()
  expect(harness.states).toContain('listening')
  expect(onListening).toHaveBeenCalledOnce()
  expect(localStorage.setItem).toHaveBeenCalledOnce()
  // No reference in the hook retains calibration PCM once the template is built.
  expect(harness.refs.some(ref => ref.current === pcm || (Array.isArray(ref.current) && ref.current.includes(pcm)))).toBe(false)
})
