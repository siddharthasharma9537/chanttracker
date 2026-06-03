import React, { HTMLAttributes, ReactNode } from 'react'
import styles from './Badge.module.css'

/**
 * Badge component for status indicators and labels
 * Used to display status, tags, and semantic information
 *
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" size="sm">Failed</Badge>
 */

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?: BadgeVariant
  /** Badge size */
  size?: BadgeSize
  /** Badge content */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
}

/**
 * Badge Component
 *
 * Features:
 * - 5 semantic variants: success, error, warning, info, neutral
 * - 2 sizes: small and medium
 * - Proper color contrast for accessibility
 * - Compact, inline display
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'md',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClass = styles.badge
    const variantClass = styles[`variant-${variant}`]
    const sizeClass = styles[`size-${size}`]

    const combinedClassName = [
      baseClass,
      variantClass,
      sizeClass,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <span
        ref={ref}
        className={combinedClassName}
        role="status"
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
