/**
 * Two-Factor Authentication (2FA) Utilities
 * Uses TOTP (Time-based One-Time Password) standard
 */

import { authenticator } from 'otplib'

/**
 * Generate a secret for 2FA setup
 */
export function generate2FASecret(email: string): string {
  return authenticator.generateSecret()
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-digit backup code
    const code = Math.floor(10000000 + Math.random() * 90000000).toString()
    codes.push(code)
  }
  return codes
}

/**
 * Generate QR code URL for authenticator app
 */
export function get2FAQRCodeURL(secret: string, email: string, issuer: string = 'FASS'): string {
  return authenticator.keyuri(email, issuer, secret)
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch (error) {
    return false
  }
}

/**
 * Verify backup code
 */
export function verifyBackupCode(code: string, backupCodes: string[]): boolean {
  return backupCodes.includes(code)
}
