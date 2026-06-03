import React, { HTMLAttributes } from 'react'
import styles from './Progress.module.css'

/**
 * Progress component with linear and circular variants
 * Used to show progress or completion status
 *
 * @example
 * <Progress value={65} label="65%" />
 * <Progress value={45} variant="circular" />
 */

export type ProgressVariant = 'linear' | 'circular'
export type ProgressSize = 'sm' | 'md' | 'lg'

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Progress value 0-100 */
  value: number
  /** Progress variant */
  variant?: ProgressVariant
  /** Component size */
  size?: ProgressSize
  /** Optional label text */
  label?: string
  /** Show percentage label */
  showLabel?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Get color based on progress value
 * 0-25%: red (error)
 * 25-50%: orange (warning)
 * 50-75%: yellow/amber (caution)
 * 75-100%: green (success)
 */
const getProgressColor = (value: number): string => {
  if (value <= 25) return 'error'
  if (value <= 50) return 'warning'
  if (value <= 75) return 'info'
  return 'success'
}

/**
 * Progress Component
 *
 * Features:
 * - Linear and circular variants
 * - Automatic color coding by percentage
 * - Optional labels
 * - ARIA labels for accessibility
 * - Smooth animations
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      variant = 'linear',
      size = 'md',
      label,
      showLabel = true,
      className = '',
      ...props
    },
    ref
  ) => {
    // Clamp value between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, value))
    const color = getProgressColor(clampedValue)
    const displayLabel = label || (showLabel ? `${clampedValue}%` : undefined)

    if (variant === 'circular') {
      const circumference = 2 * Math.PI * 45 // 45 is the radius
      const strokeDashoffset = circumference - (clampedValue / 100) * circumference

      return (
        <div
          ref={ref}
          className={`${styles.container} ${styles.circular} ${className}`}
          {...props}
        >
          <svg
            className={`${styles.circleSvg} ${styles[`size-${size}`]}`}
            viewBox="0 0 100 100"
            role="progressbar"
            aria-valuenow={clampedValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={displayLabel}
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              className={styles.circleBackground}
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={`${styles.circleFill} ${styles[`color-${color}`]}`}
              style={{
                strokeDashoffset,
                strokeDasharray: circumference,
              }}
            />
          </svg>
          {displayLabel && (
            <div className={styles.circleLabel}>{displayLabel}</div>
          )}
        </div>
      )
    }

    // Linear variant (default)
    return (
      <div
        ref={ref}
        className={`${styles.container} ${styles.linear} ${className}`}
        {...props}
      >
        {displayLabel && (
          <div className={styles.labelContainer}>
            <span className={styles.labelText}>{displayLabel}</span>
          </div>
        )}
        <div
          className={`${styles.linearTrack}`}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={displayLabel}
        >
          <div
            className={`${styles.linearFill} ${styles[`color-${color}`]} ${styles[`size-${size}`]}`}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
      </div>
    )
  }
)

Progress.displayName = 'Progress'
