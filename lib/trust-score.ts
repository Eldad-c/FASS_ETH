/**
 * Trust Score Calculation Utilities
 * Implements the trust score calculation logic based on recency and source type
 */

export type SourceType = 'STAFF' | 'USER_REPORT' | 'SYSTEM'

export interface TrustScoreParams {
  lastUpdated: Date | string
  sourceType: SourceType
  verificationCount?: number
}

/**
 * Calculates trust score based on:
 * - Recency of update (decay over time)
 * - Source type (staff updates have higher trust)
 * - Verification count (multiple user reports increase trust)
 */
export function calculateTrustScore(params: TrustScoreParams): number {
  const { lastUpdated, sourceType, verificationCount = 0 } = params
  
  const baseScore = 0.5
  const lastUpdatedDate = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated
  const now = new Date()
  const hoursOld = (now.getTime() - lastUpdatedDate.getTime()) / (1000 * 60 * 60)
  
  // Calculate recency score (decay over time)
  let recencyScore: number
  if (hoursOld <= 1) {
    recencyScore = 1.0
  } else if (hoursOld <= 6) {
    recencyScore = 0.9
  } else if (hoursOld <= 12) {
    recencyScore = 0.8
  } else if (hoursOld <= 24) {
    recencyScore = 0.7
  } else if (hoursOld <= 48) {
    recencyScore = 0.6
  } else {
    recencyScore = 0.5
  }
  
  // Source type weight (staff updates have higher trust)
  let sourceScore: number
  switch (sourceType) {
    case 'STAFF':
      sourceScore = 1.0
      break
    case 'USER_REPORT':
      sourceScore = 0.7
      break
    case 'SYSTEM':
      sourceScore = 0.9
      break
    default:
      sourceScore = 0.5
  }
  
  // Verification bonus (multiple user reports increase trust)
  const verificationBonus = Math.min(verificationCount * 0.05, 0.2)
  
  // Calculate final trust score
  const finalScore = baseScore + (recencyScore * 0.3) + (sourceScore * 0.2) + verificationBonus
  
  // Round to 2 decimal places and clamp between 0 and 1
  return Math.max(0, Math.min(1, Math.round(finalScore * 100) / 100))
}

/**
 * Determines source type based on user role
 */
export function getSourceType(userRole: string | null | undefined, isSystem: boolean = false): SourceType {
  if (isSystem) return 'SYSTEM'
  if (userRole?.toLowerCase() === 'staff') return 'STAFF'
  return 'USER_REPORT'
}
