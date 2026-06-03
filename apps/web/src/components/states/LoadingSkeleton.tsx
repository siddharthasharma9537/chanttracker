import React from 'react'
import styles from './LoadingSkeleton.module.css'

/**
 * LoadingSkeleton component for showing loading placeholders
 * Used to show placeholder content while data is loading
 *
 * @example
 * <LoadingSkeleton variant="card" count={3} />
 * <LoadingSkeleton variant="text" count={5} />
 */

export type SkeletonVariant = 'card' | 'text' | 'avatar' | 'heading'

export interface LoadingSkeletonProps {
  /** Skeleton variant */
  variant?: SkeletonVariant
  /** Number of skeleton items to display */
  count?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * LoadingSkeleton Component
 *
 * Features:
 * - Multiple skeleton variants: card, text, avatar, heading
 * - Animated pulse effect
 * - Accessible: marked as loading with aria-busy
 * - Lightweight placeholders
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  count = 1,
  className = '',
}) => {
  const skeletons = Array.from({ length: count })

  const renderSkeleton = (index: number) => {
    switch (variant) {
      case 'card':
        return (
          <div key={index} className={`${styles.skeleton} ${styles.card}`}>
            <div className={`${styles.element} ${styles.cardImage}`}></div>
            <div className={styles.cardContent}>
              <div className={`${styles.element} ${styles.text}`}></div>
              <div className={`${styles.element} ${styles.textSmall}`}></div>
            </div>
          </div>
        )

      case 'avatar':
        return (
          <div
            key={index}
            className={`${styles.skeleton} ${styles.avatar} ${styles.inline}`}
          >
            <div className={`${styles.element} ${styles.avatarImage}`}></div>
          </div>
        )

      case 'heading':
        return (
          <div key={index} className={`${styles.skeleton}`}>
            <div
              className={`${styles.element} ${styles.text}`}
              style={{ width: '60%' }}
            ></div>
          </div>
        )

      case 'text':
      default:
        return (
          <div key={index} className={`${styles.skeleton}`}>
            <div className={`${styles.element} ${styles.text}`}></div>
            <div
              className={`${styles.element} ${styles.text}`}
              style={{ width: '90%' }}
            ></div>
          </div>
        )
    }
  }

  return (
    <div
      className={`${styles.container} ${className}`}
      aria-busy="true"
      aria-label="loading"
      role="status"
    >
      {skeletons.map((_, index) => renderSkeleton(index))}
    </div>
  )
}

LoadingSkeleton.displayName = 'LoadingSkeleton'
