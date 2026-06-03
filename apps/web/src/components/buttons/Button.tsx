import React, { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

/**
 * Button component with multiple variants, sizes, and states
 * Uses design tokens for consistent styling across the application
 *
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="secondary" disabled>Disabled button</Button>
 * <Button variant="ghost" loading>Loading...</Button>
 */

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Whether the button is disabled */
  disabled?: boolean
  /** Show loading state with spinner */
  loading?: boolean
  /** Button content */
  children: ReactNode
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Button Component
 *
 * Features:
 * - 4 variants: primary, secondary, tertiary, ghost
 * - 3 sizes: sm, md, lg
 * - Loading state with spinner
 * - Disabled state with appropriate styling
 * - Full keyboard and accessibility support
 * - Smooth hover/active/focus transitions
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClass = styles.button
    const variantClass = styles[`variant-${variant}`]
    const sizeClass = styles[`size-${size}`]
    const disabledClass = (disabled || loading) ? styles.disabled : ''
    const loadingClass = loading ? styles.loading : ''

    const combinedClassName = [
      baseClass,
      variantClass,
      sizeClass,
      disabledClass,
      loadingClass,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} aria-label="loading">
            <span className={styles.spinnerDot}></span>
          </span>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
