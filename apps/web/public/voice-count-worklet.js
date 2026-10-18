/* A single in-flight message; slow consumers keep at most two seconds of PCM. */
class VoiceCountProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.chunk = new Float32Array(1024)
    this.offset = 0
    this.queue = []
    this.ready = true
    this.port.onmessage = () => { this.ready = true; this.flush() }
  }
  flush() {
    if (this.ready && this.queue.length) {
      const item = this.queue.shift()
      this.port.postMessage(item, [item.pcm.buffer])
      this.ready = false
    }
  }
  process(inputs) {
    const channel = inputs[0]?.[0]
    if (channel) {
      for (const sample of channel) {
        this.chunk[this.offset++] = sample
        if (this.offset === this.chunk.length) {
          this.queue.push({ pcm: this.chunk, time: currentTime })
          while (this.queue.length * 1024 > sampleRate * 2) this.queue.shift()
          this.chunk = new Float32Array(1024)
          this.offset = 0
          this.flush()
        }
      }
    }
    return true
  }
}
registerProcessor('voice-count', VoiceCountProcessor)
