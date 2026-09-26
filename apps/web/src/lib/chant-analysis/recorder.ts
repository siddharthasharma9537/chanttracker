export interface ChantRecording {
  audio: Blob
  mimeType: string
  durationMs: number
}

export interface ChantRecorder {
  stop(): Promise<ChantRecording>
  cancel(): void
}

function preferredMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

/**
 * Starts a short microphone recording for one chant repetition.
 * Callers own the repetition boundary and call stop() when the chant ends.
 */
export async function startChantRecording(): Promise<ChantRecorder> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone recording is not supported on this device.')
  }
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder is not supported on this device.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })
  const mimeType = preferredMimeType()
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
  const chunks: BlobPart[] = []
  const startedAt = performance.now()
  let settled = false

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })
  recorder.start()

  const release = () => stream.getTracks().forEach((track) => track.stop())

  return {
    stop: () =>
      new Promise<ChantRecording>((resolve, reject) => {
        if (settled) {
          reject(new Error('Chant recording has already ended.'))
          return
        }
        settled = true
        recorder.addEventListener('stop', () => {
          const actualMimeType = recorder.mimeType || mimeType || 'audio/webm'
          release()
          resolve({
            audio: new Blob(chunks, { type: actualMimeType }),
            mimeType: actualMimeType,
            durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
          })
        }, { once: true })
        recorder.addEventListener('error', () => {
          release()
          reject(new Error('Microphone recording failed.'))
        }, { once: true })
        recorder.stop()
      }),
    cancel: () => {
      if (settled) return
      settled = true
      if (recorder.state !== 'inactive') recorder.stop()
      release()
    },
  }
}
