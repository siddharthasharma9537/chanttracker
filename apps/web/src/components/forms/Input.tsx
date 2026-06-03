import React, { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import styles from './Input.module.css'

/**
 * Input component with support for text, email, password, number, textarea, and select
 * Includes labels, error states, and accessibility features
 *
 * @example
 * <Input label="Email" type="email" placeholder="you@example.com" />
 * <Input label="Password" type="password" error="Password is required" />
 * <Input label="Message" type="textarea" rows={4} />
 */

export type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'

export interface InputBaseProps {
  /** Input label */
  label?: string
  /** Error message to display */
  error?: string
  /** Whether the field is disabled */
  disabled?: boolean
  /** Whether the field is required */
  required?: boolean
  /** Additional CSS classes */
  className?: string
  /** Helper text below input */
  helperText?: string
}

export interface InputProps extends InputBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  type?: Exclude<InputType, 'textarea' | 'select'>
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export interface TextareaProps extends InputBaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  type: 'textarea'
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export interface SelectProps extends InputBaseProps, Omit<InputHTMLAttributes<HTMLSelectElement>, 'type' | 'onChange'> {
  type: 'select'
  children: ReactNode
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export type InputComponentProps = InputProps | TextareaProps | SelectProps

/**
 * Input Component
 *
 * Features:
 * - Multiple input types: text, email, password, number, textarea, select
 * - Label with required indicator
 * - Error state with message display
 * - Helper text support
 * - Disabled state
 * - Full keyboard navigation support
 * - Proper ARIA labels and descriptions
 * - Focus and hover states
 */
export const Input = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  InputComponentProps
>(
  (
    {
      label,
      placeholder,
      error,
      disabled = false,
      required = false,
      className = '',
      helperText,
      ...props
    },
    ref
  ) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined

    const containerClass = [styles.container, error ? styles.hasError : '', className]
      .filter(Boolean)
      .join(' ')

    const fieldClass = [styles.field, disabled ? styles.disabled : ''].filter(Boolean).join(' ')

    // Handle textarea type
    if ('type' in props && props.type === 'textarea') {
      const textareaProps = props as TextareaProps
      return (
        <div className={containerClass}>
          {label && (
            <label htmlFor={inputId} className={styles.label}>
              {label}
              {required && <span className={styles.required} aria-label="required">*</span>}
            </label>
          )}
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            id={inputId}
            className={fieldClass}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            {...(textareaProps as any)}
          />
          {error && (
            <span id={errorId} className={styles.errorMessage} role="alert">
              {error}
            </span>
          )}
          {helperText && !error && (
            <span id={helperId} className={styles.helperText}>
              {helperText}
            </span>
          )}
        </div>
      )
    }

    // Handle select type
    if ('type' in props && props.type === 'select') {
      const selectProps = props as SelectProps
      return (
        <div className={containerClass}>
          {label && (
            <label htmlFor={inputId} className={styles.label}>
              {label}
              {required && <span className={styles.required} aria-label="required">*</span>}
            </label>
          )}
          <select
            ref={ref as React.RefObject<HTMLSelectElement>}
            id={inputId}
            className={fieldClass}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            {...(selectProps as any)}
          >
            {selectProps.children}
          </select>
          {error && (
            <span id={errorId} className={styles.errorMessage} role="alert">
              {error}
            </span>
          )}
          {helperText && !error && (
            <span id={helperId} className={styles.helperText}>
              {helperText}
            </span>
          )}
        </div>
      )
    }

    // Handle regular input types
    const inputProps = props as InputProps
    return (
      <div className={containerClass}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-label="required">*</span>}
          </label>
        )}
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          id={inputId}
          className={fieldClass}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          {...inputProps}
        />
        {error && (
          <span id={errorId} className={styles.errorMessage} role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
