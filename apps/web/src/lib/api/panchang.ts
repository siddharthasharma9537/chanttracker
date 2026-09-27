export interface NamedPeriod {
  starts_at: string
  ends_at: string
}

export interface Tithi extends NamedPeriod {
  index: number
  name_en: string
  name_te: string
  paksha: 'Shukla' | 'Krishna'
}

export interface Nakshatra extends NamedPeriod {
  index: number
  name_en: string
  name_te: string
  pada: number
}

export interface Vara {
  index: number
  name_en: string
  name_te: string
}

export interface Panchang {
  date: string
  sunrise: string
  sunset: string
  vara: Vara
  tithi: Tithi
  nakshatra: Nakshatra
  festivals: string[]
}

/** Proxied through our own API route (apps/web/src/app/api/panchang/route.ts)
 *  to the real SoHum Jyotisha panchangam service — the canonical,
 *  Swiss-Lahiri-computed source shared across the SoHum suite, not a local
 *  approximation. */
export async function getPanchang(date = new Date().toLocaleDateString('sv')): Promise<Panchang> {
  const res = await fetch(`/api/panchang?date=${encodeURIComponent(date)}`)
  if (!res.ok) throw new Error(`Panchang lookup failed (${res.status})`)
  return res.json()
}
