/**
 * API helper functions for consistent error handling and responses
 */
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ApiError {
  error: string
  details?: unknown
  statusCode: number
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: message,
      details: details || undefined,
      statusCode,
    },
    { status: statusCode }
  )
}

/**
 * Handles Zod validation errors
 */
export function handleValidationError(error: ZodError): NextResponse<ApiError> {
  const details = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }))

  return createErrorResponse('Validation error', 400, details)
}

/**
 * Handles unknown errors
 */
export function handleUnknownError(error: unknown): NextResponse<ApiError> {
  if (error instanceof ZodError) {
    return handleValidationError(error)
  }

  if (error instanceof Error) {
    console.error('API Error:', error.message, error.stack)
    return createErrorResponse(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      500
    )
  }

  console.error('Unknown API Error:', error)
  return createErrorResponse('Internal server error', 500)
}

/**
 * Verifies user authentication and returns user/profile
 */
export async function verifyAuth(
  supabase: SupabaseClient
): Promise<{ user: { id: string; email?: string } | null; error: NextResponse<ApiError> | null }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: createErrorResponse('Unauthorized', 401),
    }
  }

  return { user, error: null }
}

/**
 * Verifies user has required role
 */
export async function verifyRole(
  supabase: SupabaseClient,
  allowedRoles: string[]
): Promise<{ hasAccess: boolean; error: NextResponse<ApiError> | null }> {
  const { user, error: authError } = await verifyAuth(supabase)

  if (authError || !user) {
    return { hasAccess: false, error: authError }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      hasAccess: false,
      error: createErrorResponse('User profile not found', 404),
    }
  }

  // Normalize role comparison (database uses uppercase, TypeScript uses lowercase)
  const userRole = profile.role?.toLowerCase()
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase())

  if (!normalizedAllowedRoles.includes(userRole)) {
    return {
      hasAccess: false,
      error: createErrorResponse('Forbidden', 403),
    }
  }

  return { hasAccess: true, error: null }
}

/**
 * Creates pagination metadata
 */
export function createPaginationMeta(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}
