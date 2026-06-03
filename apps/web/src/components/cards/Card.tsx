import React, { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

/**
 * Card component with glassmorphism variants
 * Used for containing content with consistent spacing and visual hierarchy
 *
 * @example
 * <Card variant="featured">Featured content</Card>
 * <Card variant="standard" className="custom-class">Standard card</Card>
 */

export type CardVariant = 'featured' | 'standard' | 'subtle'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant
  /** Card content */
  children: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Interactive element - adds hover effect */
  interactive?: boolean
}

/**
 * Card Component
 *
 * Features:
 * - 3 glassmorphic variants with different opacity levels
 * - Smooth hover effects
 * - Consistent padding and border radius
 * - Accessibility support
 * - Responsive design
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'standard',
      children,
      className = '',
      interactive = false,
      ...props
    },
    ref
  ) => {
    const baseClass = styles.card
    const variantClass = styles[`variant-${variant}`]
    const interactiveClass = interactive ? styles.interactive : ''

    const combinedClassName = [
      baseClass,
      variantClass,
      interactiveClass,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={ref}
        className={combinedClassName}
        role="region"
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
