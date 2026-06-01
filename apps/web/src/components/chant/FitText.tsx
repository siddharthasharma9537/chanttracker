'use client'

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

interface FitTextProps {
  /** The text to render and auto-fit. */
  text: string
  /** Largest font size (px) to try. */
  max?: number
  /** Smallest font size (px) allowed before clamping. */
  min?: number
  /** Line height multiplier. */
  lineHeight?: number
  /** Font family for the text. */
  fontFamily?: string
  className?: string
  style?: CSSProperties
}

/**
 * Renders `text` at the largest font size (between `min` and `max`) at which it
 * still fits — both vertically and horizontally — inside its parent box without
 * overflowing. Re-fits on container resize. This lets us guarantee that several
 * mantras coexist on a single non-scrolling screen.
 */
export function FitText({
  text,
  max = 56,
  min = 11,
  lineHeight = 1.4,
  fontFamily,
  className = '',
  style,
}: FitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  // Start near the middle to reduce the first-paint jump.
  const [, setSize] = useState(Math.round((max + min) / 2))

  useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    let frame = 0

    const fit = () => {
      const availH = container.clientHeight
      const availW = container.clientWidth
      if (availH === 0 || availW === 0) return

      let lo = min
      let hi = max
      let best = min

      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        textEl.style.fontSize = `${mid}px`
        const fits =
          textEl.scrollHeight <= availH && textEl.scrollWidth <= availW
        if (fits) {
          best = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }

      textEl.style.fontSize = `${best}px`
      setSize(best)
    }

    frame = requestAnimationFrame(fit)
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(fit)
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, max, min])

  if (!text) return null

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full items-center justify-center overflow-hidden ${className}`}
    >
      <p
        ref={textRef}
        className="m-0 text-center"
        style={{
          fontFamily,
          lineHeight,
          letterSpacing: '0.01em',
          ...style,
        }}
      >
        {text}
      </p>
    </div>
  )
}
