import React, { ReactNode } from 'react'
import { Button } from '../buttons/Button'
import styles from './EmptyState.module.css'

/**
 * EmptyState component for displaying empty content areas
 * Used when there is no data to display with a call-to-action
 *
 * @example
 * <EmptyState
 *   heading="No mantras yet"
 *   description="Start by adding a new mantra"
 *   ctaLabel="Add Mantra"
 *   onCTA={() => navigate('/add')}
 * />
 */

export interface EmptyStateProps {
  /** Icon or visual element (ReactNode) */
  icon?: ReactNode
  /** Heading text */
  heading: string
  /** Description text */
  description: string
  /** CTA button label */
  ctaLabel?: string
  /** CTA button click handler */
  onCTA?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * EmptyState Component
 *
 * Features:
 * - Icon/visual element support
 * - Clear heading and description
 * - Optional call-to-action button
 * - Centered layout
 * - Proper spacing and typography
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  heading,
  description,
  ctaLabel,
  onCTA,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.description}>{description}</p>
      {ctaLabel && onCTA && (
        <Button
          variant="primary"
          size="md"
          onClick={onCTA}
          className={styles.cta}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}

EmptyState.displayName = 'EmptyState'
