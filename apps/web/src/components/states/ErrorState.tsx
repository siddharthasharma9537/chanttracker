import React, { ReactNode } from 'react'
import { Button } from '../buttons/Button'
import styles from './ErrorState.module.css'

/**
 * ErrorState component for displaying error messages and recovery options
 * Used when an error occurs and the user needs to recover
 *
 * @example
 * <ErrorState
 *   message="Failed to load data"
 *   details="Please check your connection and try again"
 *   onRetry={() => refetch()}
 * />
 */

export interface ErrorStateProps {
  /** Error icon or visual element */
  icon?: ReactNode
  /** Main error message */
  message: string
  /** Detailed error information */
  details?: string
  /** Retry button click handler */
  onRetry?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * ErrorState Component
 *
 * Features:
 * - Error icon/visual element
 * - Clear error message
 * - Optional detailed error information
 * - Retry button
 * - Centered layout
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  icon,
  message,
  details,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {icon ? (
        <div className={styles.icon}>{icon}</div>
      ) : (
        <div className={styles.icon} aria-label="error icon">
          ⚠️
        </div>
      )}
      <h2 className={styles.heading}>{message}</h2>
      {details && <p className={styles.details}>{details}</p>}
      {onRetry && (
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          className={styles.retryButton}
        >
          Try Again
        </Button>
      )}
    </div>
  )
}

ErrorState.displayName = 'ErrorState'
