/**
 * Pagination utilities
 */

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Calculates pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
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

/**
 * Calculates offset from page and limit
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Validates pagination parameters
 */
export function validatePagination(
  page: number | string | null | undefined,
  limit: number | string | null | undefined
): PaginationParams {
  const validatedPage = Math.max(1, Number(page) || 1)
  const validatedLimit = Math.min(100, Math.max(1, Number(limit) || 20))
  return {
    page: validatedPage,
    limit: validatedLimit,
  }
}
