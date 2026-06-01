'use client'

import { FitText } from './FitText'

interface CounterDisplayProps {
  count: number
  target: number
  mantraName?: string
  mantraDevanagari?: string
  name_te?: string
  adhidevata_te?: string
  adhidevata_devanagari?: string
  adhidevata_mantra_te?: string
  adhidevata_mantra_devanagari?: string
  pratyadhidevata_te?: string
  pratyadhidevata_devanagari?: string
  pratyadhidevata_mantra_te?: string
  pratyadhidevata_mantra_devanagari?: string
  mantra_te?: string
  mantra_devanagari?: string
  durationSecs: number
  state: 'idle' | 'active' | 'paused' | 'completed' | 'abandoned'
  color?: string
  /** Tapping the main mantra area increments the count. */
  onIncrement?: () => void
}

const TELUGU = '"Noto Sans Telugu", sans-serif'
const DEVANAGARI = '"Noto Sans Devanagari", serif'

export function CounterDisplay({
  count,
  target,
  mantraName,
  name_te,
  adhidevata_te,
  adhidevata_mantra_te,
  adhidevata_mantra_devanagari,
  pratyadhidevata_te,
  pratyadhidevata_mantra_te,
  pratyadhidevata_mantra_devanagari,
  mantra_te,
  mantra_devanagari,
  state,
  color = '#f97316',
  onIncrement,
}: CounterDisplayProps) {
  const mainText = mantra_te || mantra_devanagari || ''
  const mainFont = mantra_te ? TELUGU : DEVANAGARI

  const adhiText = adhidevata_mantra_te || adhidevata_mantra_devanagari || ''
  const adhiFont = adhidevata_mantra_te ? TELUGU : DEVANAGARI

  const pratyaText =
    pratyadhidevata_mantra_te || pratyadhidevata_mantra_devanagari || ''
  const pratyaFont = pratyadhidevata_mantra_te ? TELUGU : DEVANAGARI

  const hasDeities = Boolean(adhiText || pratyaText)
  const canTap = state === 'active' && Boolean(onIncrement)

  return (
    <div
      className={`grid h-full min-h-0 w-full max-w-6xl mx-auto gap-2 sm:gap-3 ${
        hasDeities
          ? 'grid-rows-[minmax(0,1.5fr)_minmax(0,1fr)] grid-cols-2 lg:grid-rows-1 lg:grid-cols-[1fr_1.7fr_1fr]'
          : 'grid-rows-1 grid-cols-1'
      }`}
    >
      {/* MAIN MANTRA — hero + primary tap target */}
      <button
        type="button"
        onClick={canTap ? onIncrement : undefined}
        disabled={!canTap}
        className={`group relative col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 flex min-h-0 min-w-0 flex-col rounded-2xl border border-white/15 bg-white/[0.07] p-3 sm:p-5 text-left backdrop-blur-md transition ${
          canTap
            ? 'cursor-pointer hover:bg-white/[0.10] active:scale-[0.99] active:bg-white/[0.13]'
            : 'cursor-default'
        }`}
      >
        {/* Header row: label + live count */}
        <div className="flex shrink-0 items-start justify-between gap-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/40">
            {name_te || mantraName || 'Mantra'}
          </span>
          <span
            className="font-bold tabular-nums leading-none"
            style={{ color }}
          >
            <span className="text-2xl sm:text-3xl">{count}</span>
            <span className="text-sm text-white/40"> / {target}</span>
          </span>
        </div>

        {/* The mantra itself, auto-fitted to remaining space */}
        <div className="mt-1 min-h-0 flex-1">
          <FitText
            text={mainText}
            max={64}
            min={16}
            lineHeight={1.5}
            fontFamily={mainFont}
            style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}
          />
        </div>

        {/* Tap affordance */}
        {canTap && (
          <span className="pointer-events-none mt-1 shrink-0 text-center text-[10px] uppercase tracking-widest text-white/30 transition group-hover:text-white/50">
            tap anywhere to count
          </span>
        )}
      </button>

      {/* ADHIDEVATA (presiding) */}
      {hasDeities && (
        <div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-4 lg:col-start-1 lg:row-start-1">
          <span className="shrink-0 truncate text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-amber-300/80">
            ✨ {adhidevata_te || 'Presiding Deity'}
          </span>
          <div className="mt-1 min-h-0 flex-1">
            {adhiText ? (
              <FitText
                text={adhiText}
                max={30}
                min={11}
                lineHeight={1.45}
                fontFamily={adhiFont}
                style={{ color: 'rgba(255,255,255,0.82)' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/30">
                —
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRATYADHIDEVATA (counter-deity) */}
      {hasDeities && (
        <div className="flex min-h-0 min-w-0 flex-col rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:p-4 lg:col-start-3 lg:row-start-1">
          <span className="shrink-0 truncate text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-sky-300/80">
            ⚔️ {pratyadhidevata_te || 'Counter-Deity'}
          </span>
          <div className="mt-1 min-h-0 flex-1">
            {pratyaText ? (
              <FitText
                text={pratyaText}
                max={30}
                min={11}
                lineHeight={1.45}
                fontFamily={pratyaFont}
                style={{ color: 'rgba(255,255,255,0.82)' }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/30">
                —
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
