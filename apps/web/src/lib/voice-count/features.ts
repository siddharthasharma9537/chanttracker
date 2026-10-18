export const BANDS = 13
export const HOP_SECONDS = 0.01

const transforms = new Map<number, { cos: Float64Array; sin: Float64Array }>()
const windows = new Map<number, Float64Array>()

/** In-place radix-2 transform; only the power spectrum is used. */
function fft(real: Float64Array, imag: Float64Array) {
  const n = real.length
  if (!transforms.has(n)) transforms.set(n, {
    cos: Float64Array.from({ length: n / 2 }, (_, i) => Math.cos(-2 * Math.PI * i / n)),
    sin: Float64Array.from({ length: n / 2 }, (_, i) => Math.sin(-2 * Math.PI * i / n)),
  })
  const { cos, sin } = transforms.get(n)!
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[real[i], real[j]] = [real[j], real[i]]
    }
  }
  for (let size = 2; size <= n; size *= 2) {
    const stride = n / size
    for (let start = 0; start < n; start += size) {
      for (let j = 0; j < size / 2; j++) {
        const c = cos[stride * j], s = sin[stride * j]
        const a = start + j, b = a + size / 2
        const re = real[b] * c - imag[b] * s
        const im = real[b] * s + imag[b] * c
        real[b] = real[a] - re
        imag[b] = imag[a] - im
        real[a] += re
        imag[a] += im
      }
    }
  }
}

export function frames(samples: Float32Array, sampleRate: number): Float32Array[] {
  const size = Math.round(sampleRate * 0.025), hop = Math.round(sampleRate * HOP_SECONDS)
  let n = 1
  while (n < size) n *= 2
  if (!windows.has(size)) windows.set(size, Float64Array.from({ length: size }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1))))
  const window = windows.get(size)!
  const result: Float32Array[] = []
  for (let start = 0; start + size <= samples.length; start += hop) {
    const real = new Float64Array(n), imag = new Float64Array(n)
    let energy = 0
    for (let i = 0; i < size; i++) {
      const value = samples[start + i]
      energy += value * value
      real[i] = value * window[i]
    }
    fft(real, imag)
    const feature = new Float32Array(BANDS)
    feature[0] = Math.log(Math.max(1e-8, energy / size))
    for (let band = 0; band < BANDS - 1; band++) {
      const lo = Math.max(1, Math.floor((80 * Math.pow(50, band / 12)) * n / sampleRate))
      const hi = Math.min(n / 2, Math.ceil((80 * Math.pow(50, (band + 1) / 12)) * n / sampleRate))
      let power = 0
      for (let k = lo; k < hi; k++) power += real[k] ** 2 + imag[k] ** 2
      // Relative band energy retains timbre without amplifying quiet noise.
      feature[band + 1] = Math.log(0.01 + power / (n * Math.max(energy, size * 1e-8)))
    }
    result.push(feature)
  }
  return result
}

/** Keeps only the unfinished frame, including its overlap, between chunks. */
export class FeatureStream {
  private tail = new Float32Array(0)
  constructor(readonly sampleRate: number) {}
  push(chunk: Float32Array) {
    const joined = new Float32Array(this.tail.length + chunk.length)
    joined.set(this.tail)
    joined.set(chunk, this.tail.length)
    const result = frames(joined, this.sampleRate)
    this.tail = joined.slice(result.length * Math.round(this.sampleRate * HOP_SECONDS))
    return result
  }
  get retainedSamples() { return this.tail.length }
}
