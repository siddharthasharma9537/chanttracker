import { createClient } from '@/lib/supabase/client'
import type { MantraRow, MantraTextRow } from '@/types/database'

export interface Mantra extends MantraRow {
  texts: Pick<MantraTextRow, 'lang' | 'script' | 'text' | 'has_swaras'>[]
  adhidevata?: Mantra
  pratyadhidevata?: Mantra
}

/**
 * Preferred display text: Telugu without swaras first (renders everywhere —
 * Vedic swara marks on Telugu glyphs are tofu in Noto fonts), then Telugu
 * with swaras, then Sanskrit/Devanagari, then anything.
 */
export function displayText(m: Mantra | undefined, lang = 'te'): string {
  if (!m?.texts?.length) return ''
  const t =
    m.texts.find((t) => t.lang === lang && !t.has_swaras) ||
    m.texts.find((t) => t.lang === lang) ||
    m.texts.find((t) => t.lang === 'sa' && !t.has_swaras) ||
    m.texts[0]
  return t?.text ?? ''
}

export function displayScript(m: Mantra | undefined, lang = 'te'): string {
  if (!m?.texts?.length) return 'telugu'
  const t = m.texts.find((t) => t.lang === lang) || m.texts[0]
  return t?.script ?? 'telugu'
}

/**
 * All active mantras with their texts. Graha mantras get their
 * adhidevata/pratyadhidevata attached (linked via parent_graha_id).
 * Only top-level mantras (graha + devata + custom) are returned;
 * deity sub-mantras live on their parent.
 */
export async function listMantras(): Promise<Mantra[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mantras')
    .select(
      'id, name_en, name_te, deity, category, mantra_type, parent_graha_id, default_target, accent_color, weekday_tags, owner_id, is_active, is_archived, mantra_texts(lang, script, text, has_swaras)'
    )
    .eq('is_active', true)
    .or('is_archived.is.null,is_archived.eq.false')
  if (error) throw error

  const all: Mantra[] = (data ?? []).map((r: any) => ({
    ...r,
    texts: r.mantra_texts ?? [],
  }))

  const byParent = (type: string) =>
    new Map(
      all
        .filter((m) => m.mantra_type === type && m.parent_graha_id)
        .map((m) => [m.parent_graha_id as string, m])
    )
  const adhi = byParent('adhidevata')
  const pratya = byParent('pratyadhidevata')

  const top = all.filter(
    (m) => m.mantra_type !== 'adhidevata' && m.mantra_type !== 'pratyadhidevata' && m.mantra_type !== 'salutation'
  )
  for (const m of top) {
    m.adhidevata = adhi.get(m.id)
    m.pratyadhidevata = pratya.get(m.id)
  }

  // Grahas first (by name), then the rest alphabetically
  top.sort((a, b) => {
    const ag = a.category === 'navagraha' ? 0 : 1
    const bg = b.category === 'navagraha' ? 0 : 1
    return ag - bg || (a.name_en ?? '').localeCompare(b.name_en ?? '')
  })
  return top
}
