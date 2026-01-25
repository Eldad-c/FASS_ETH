/**
 * Role comparison helpers
 * Handles case-insensitive role comparisons since database uses uppercase
 * and TypeScript types use lowercase
 */
import type { UserRole } from './types'

/**
 * Normalizes a role string to lowercase for comparison
 */
export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null
  return role.toLowerCase() as UserRole
}

/**
 * Checks if a user role matches any of the allowed roles (case-insensitive)
 */
export function hasRole(
  userRole: string | null | undefined,
  allowedRoles: UserRole[]
): boolean {
  const normalized = normalizeRole(userRole)
  if (!normalized) return false
  return allowedRoles.includes(normalized)
}

/**
 * Checks if user has admin role
 */
export function isAdmin(role: string | null | undefined): boolean {
  return hasRole(role, ['admin'])
}

/**
 * Checks if user has staff role
 */
export function isStaff(role: string | null | undefined): boolean {
  return hasRole(role, ['staff'])
}

/**
 * Checks if user has logistics role
 */
export function isLogistics(role: string | null | undefined): boolean {
  return hasRole(role, ['logistics'])
}

/**
 * Checks if user has driver role
 */
export function isDriver(role: string | null | undefined): boolean {
  return hasRole(role, ['driver'])
}
