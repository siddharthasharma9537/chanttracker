/**
 * Generate a unique 6-character alphanumeric code from email and mobile number
 * Uses a deterministic hash to ensure same email+mobile always produces same code
 */
export function generateAssignmentCode(email: string, mobile: string): string {
  const combined = `${email.toLowerCase()}${mobile.replace(/\D/g, '')}`

  // Simple hash function to generate a deterministic 6-char code
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Convert hash to positive number and create alphanumeric string
  const absHash = Math.abs(hash)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''

  let num = absHash
  for (let i = 0; i < 6; i++) {
    code = chars[num % 36] + code
    num = Math.floor(num / 36)
  }

  return code
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate mobile number (accepts various formats)
 */
export function isValidMobile(mobile: string): boolean {
  const digitsOnly = mobile.replace(/\D/g, '')
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}
