'use client'

import React from 'react'

interface RudrakshBeadProps {
  onClick: () => void
  disabled?: boolean
  color?: string
  isActive?: boolean
  size?: 'small' | 'medium' | 'large'
}

// Navagraha color mapping for reference
export const NAVAGRAHA_COLORS = {
  surya: '#FFD700', // Golden
  chandra: '#E0E0E0', // Silver
  mangal: '#DC143C', // Crimson
  budha: '#32CD32', // Lime Green
  guru: '#FFB347', // Orange
  shukra: '#90EE90', // Light Green
  shani: '#696969', // Dim Gray
  rahu: '#FF6347', // Tomato
  ketu: '#DAA520', // Goldenrod
}

export function RudrakshaBead({
  onClick,
  disabled = false,
  color = '#FFD700',
  isActive = true,
  size = 'medium',
}: RudrakshBeadProps) {
  const [isPressed, setIsPressed] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const handleMouseDown = () => {
    if (!disabled && isActive) {
      setIsPressed(true)
    }
  }

  const handleMouseUp = () => {
    setIsPressed(false)
  }

  const handleClick = () => {
    if (!disabled && isActive) {
      onClick()
    }
  }

  // Size configuration
  const sizeConfig = {
    small: { container: 'w-16 h-16', svg: 24 },
    medium: { container: 'w-20 h-20', svg: 32 },
    large: { container: 'w-24 h-24', svg: 40 },
  }

  const config = sizeConfig[size]
  const isDisabled = disabled || !isActive
  const opacity = isDisabled ? 0.5 : 1

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glassmorphic glow background (enhanced on hover) */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          isHovered && !isDisabled ? 'scale-125 opacity-100' : 'scale-100 opacity-60'
        }`}
        style={{
          background: `radial-gradient(circle, ${color}40 0%, ${color}20 70%, transparent 100%)`,
          filter: `blur(${isHovered && !isDisabled ? '12px' : '8px'})`,
          zIndex: 0,
        }}
      />

      {/* Main button */}
      <button
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseEnter={() => setIsHovered(true)}
        disabled={isDisabled}
        className={`relative ${config.container} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/30 transition-all duration-150 ease-out ${
          isPressed ? 'scale-95' : isHovered && !isDisabled ? 'scale-110' : 'scale-100'
        } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
          opacity: opacity,
        }}
        aria-label="Increment chant count"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: `drop-shadow(0 8px 16px ${color}30)`,
          }}
        >
          <defs>
            {/* Main radial gradient with rich depth */}
            <radialGradient id={`beadGradient-${color}`} cx="35%" cy="35%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.95 }} />
              <stop offset="50%" style={{ stopColor: color, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.75 }} />
            </radialGradient>

            {/* Subtle inner shadow for depth */}
            <filter id={`beadInnerShadow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="coloredBlur" />
              <feOffset in="coloredBlur" dx="0" dy="1" result="offsetblur" />
              <feFlood floodColor={color} floodOpacity="0.3" result="offsetcolor" />
              <feComposite in="offsetcolor" in2="offsetblur" operator="in" result="offsetblur" />
              <feComposite in="offsetblur" in2="SourceGraphic" operator="in" result="offsetblur" />
              <feMerge>
                <feMergeNode in="offsetblur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glow filter */}
            <filter id={`glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Soft outer glow layer */}
          <circle
            cx="100"
            cy="100"
            r="98"
            fill={color}
            opacity="0.08"
            style={{
              filter: 'blur(2px)',
            }}
          />

          {/* Main bead body with gradient */}
          <circle
            cx="100"
            cy="100"
            r="85"
            fill={`url(#beadGradient-${color})`}
            filter={`url(#beadInnerShadow-${color})`}
          />

          {/* Rudraksha ridges (5 characteristic vertical mukhi lines) —
              dark stroke so they stay visible on any planet color */}
          <g stroke="rgba(55,28,8,0.6)" strokeWidth="3" fill="none" strokeLinecap="round">
            {/* Left ridges */}
            <path d="M 80 35 Q 75 100, 80 165" />
            <path d="M 62 55 Q 56 100, 62 145" />

            {/* Center ridge (main) */}
            <path d="M 100 22 L 100 178" strokeWidth="3.4" />

            {/* Right ridges */}
            <path d="M 138 55 Q 144 100, 138 145" />
            <path d="M 120 35 Q 125 100, 120 165" />
          </g>

          {/* Luminous highlights for sacred shine */}
          <g opacity="0.3" fill="white">
            {/* Top highlight */}
            <ellipse cx="75" cy="52" rx="18" ry="12" />
            {/* Secondary shine */}
            <circle cx="100" cy="38" r="6" opacity="0.4" />
          </g>

          {/* Sacred symbol: Om character (very subtle, optional) */}
          <text
            x="100"
            y="108"
            fontSize="16"
            fontWeight="300"
            textAnchor="middle"
            fill="white"
            opacity="0.25"
            fontFamily='"Tiro Devanagari Sanskrit", serif'
          >
            ॐ
          </text>

          {/* Subtle depth shadow at base */}
          <ellipse cx="100" cy="172" rx="55" ry="10" fill="black" opacity="0.08" />
        </svg>
      </button>
    </div>
  )
}
