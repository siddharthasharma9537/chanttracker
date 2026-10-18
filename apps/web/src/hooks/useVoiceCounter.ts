'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildTemplate, Detector, FeatureStream, sampleFeatures, type CountEvent } from '@/lib/voice-count'
import * as templates from '@/lib/voiceTemplates'
import { copy } from '@/lib/voice-count/copy'

export type VoiceState = 'idle' | 'requesting' | 'denied' | 'calibrating' | 'listening' | 'paused-hidden' | 'error'

export function useVoiceCounter(mantraId: string, onEvent: (event: CountEvent) => void, onListening: () => void) {
  const [state, setState] = useState<VoiceState>('idle')
  const [message, setMessage] = useState('')
  const [sampleCount, setSampleCount] = useState(0)
  const callbacks = useRef({ onEvent, onListening })
  callbacks.current = { onEvent, onListening }
  const token = useRef(0)
  const phase = useRef<VoiceState>('idle')
  const stream = useRef<MediaStream | null>(null)
  const context = useRef<AudioContext | null>(null)
  const node = useRef<AudioWorkletNode | null>(null)
  const source = useRef<MediaStreamAudioSourceNode | null>(null)
  const detector = useRef<Detector | null>(null)
  const framer = useRef<FeatureStream | null>(null)
  const samples = useRef<Float32Array[]>([])
  const chunks = useRef<Float32Array[]>([])
  const sampleLength = useRef(0)
  const tooLong = useRef(false)

  const transition = useCallback((next: VoiceState) => {
    phase.current = next
    setState(next)
  }, [])

  const stop = useCallback((next: VoiceState = 'idle') => {
    token.current++
    if (node.current) { node.current.port.onmessage = null; node.current.disconnect() }
    source.current?.disconnect()
    stream.current?.getTracks().forEach(track => { track.onended = null; track.stop() })
    if (context.current) {
      context.current.onstatechange = null
      void context.current.close().catch(() => {})
    }
    stream.current = null; context.current = null; node.current = null; source.current = null
    detector.current = null; framer.current = null
    samples.current = []; chunks.current = []; sampleLength.current = 0; tooLong.current = false
    setSampleCount(0)
    transition(next)
  }, [transition])

  const start = useCallback(async () => {
    stop()
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined' || typeof AudioWorkletNode === 'undefined' || !('audioWorklet' in AudioContext.prototype)) {
      setMessage(copy.unsupported.en)
      transition('error')
      return
    }
    const attempt = token.current
    transition('requesting')
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false } })
      if (attempt !== token.current || document.visibilityState === 'hidden') {
        media.getTracks().forEach(track => track.stop())
        return
      }
      stream.current = media
      media.getTracks().forEach(track => { track.onended = () => stop('paused-hidden') })
      const audio = new AudioContext()
      context.current = audio
      await audio.audioWorklet.addModule('/voice-count-worklet.js')
      if (attempt !== token.current) return
      await audio.resume()
      if (attempt !== token.current) return
      if (audio.state !== 'running') { stop('paused-hidden'); return }
      const template = templates.load(mantraId)
      detector.current = template && template.sampleRate === audio.sampleRate ? new Detector(template) : null
      framer.current = new FeatureStream(audio.sampleRate)
      const worklet = new AudioWorkletNode(audio, 'voice-count')
      node.current = worklet
      source.current = audio.createMediaStreamSource(media)
      source.current.connect(worklet)
      // The processor has silent outputs; connecting it keeps it scheduled.
      worklet.connect(audio.destination)
      audio.onstatechange = () => { if (audio.state !== 'running') stop('paused-hidden') }
      worklet.port.onmessage = (event: MessageEvent<{ pcm: Float32Array; time: number }>) => {
        if (attempt !== token.current) return
        const { pcm, time } = event.data
        if (audio.currentTime - time <= 2) {
          if (phase.current === 'calibrating') {
            if (sampleLength.current + pcm.length > audio.sampleRate * 30) {
              tooLong.current = true
              chunks.current = []
              sampleLength.current = 0
              setMessage(copy.again.en)
            } else if (!tooLong.current) {
              chunks.current.push(pcm)
              sampleLength.current += pcm.length
            }
          } else if (phase.current === 'listening') {
            const events = detector.current?.push(framer.current!.push(pcm)) ?? []
            for (const result of events) {
              if (attempt !== token.current) break
              callbacks.current.onEvent(result)
            }
          }
        }
        if (attempt === token.current) worklet.port.postMessage('ready')
      }
      transition(detector.current ? 'listening' : 'calibrating')
      if (detector.current) callbacks.current.onListening()
    } catch (error) {
      if (attempt !== token.current) return
      const denied = (error as { name?: string }).name === 'NotAllowedError'
      stop(denied ? 'denied' : 'error')
      setMessage(denied ? copy.denied.en : copy.unsupported.en)
    }
  }, [mantraId, stop, transition])

  const acceptSample = (finish: boolean) => {
    if (phase.current !== 'calibrating' || !context.current) return
    const rate = context.current.sampleRate
    try {
      if (tooLong.current) throw new Error('again')
      const pcm = new Float32Array(sampleLength.current)
      let offset = 0
      for (const chunk of chunks.current) { pcm.set(chunk, offset); offset += chunk.length }
      // Done immediately after adding a sample can use the already accepted sample.
      if (!(finish && samples.current.length && pcm.length < rate * 0.4)) {
        sampleFeatures(pcm, rate)
        const next = [...samples.current, pcm]
        buildTemplate(next, rate) // Reject inconsistent lengths before accepting.
        samples.current = next
      }
      chunks.current = []; sampleLength.current = 0
      setSampleCount(samples.current.length)
      setMessage('')
      if (finish || samples.current.length === 3) {
        const template = buildTemplate(samples.current, rate)
        templates.save(mantraId, template)
        detector.current = new Detector(template)
        framer.current = new FeatureStream(rate)
        samples.current = []; chunks.current = []; sampleLength.current = 0
        transition('listening')
        callbacks.current.onListening()
      }
    } catch {
      chunks.current = []; sampleLength.current = 0; tooLong.current = false
      setMessage(copy.again.en)
    }
  }

  useEffect(() => {
    const hidden = () => { if (document.visibilityState === 'hidden') stop('paused-hidden') }
    document.addEventListener('visibilitychange', hidden)
    return () => { document.removeEventListener('visibilitychange', hidden); stop() }
  }, [stop, mantraId])

  return { state, message, sampleCount, start, stop, done: () => acceptSample(true), addSample: () => acceptSample(false), reset: () => detector.current?.reset() }
}
