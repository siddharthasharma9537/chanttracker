import { deserialize, serialize, type VoiceTemplate } from './voice-count'
const key = (mantraId: string) => `voiceTemplate:v1:${mantraId}`
export function load(mantraId: string): VoiceTemplate | null {
  try {
    const json = localStorage.getItem(key(mantraId))
    const result = json ? deserialize(json) : null
    if (json && !result) localStorage.removeItem(key(mantraId))
    return result
  } catch { return null }
}
export function save(mantraId: string, template: VoiceTemplate) {
  try { localStorage.setItem(key(mantraId), serialize(template)) } catch { /* Recalibrate next time. */ }
}
export function forget(mantraId: string) {
  try { localStorage.removeItem(key(mantraId)) } catch { /* Storage unavailable. */ }
}
