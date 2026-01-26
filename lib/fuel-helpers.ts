/**
 * Fuel type mapping helpers
 * Maps between database fuel types and display labels
 * Per SDS: Diesel, Benzene 95, Benzene 97
 */

export type FuelTypeCode = 'diesel' | 'benzene_95' | 'benzene_97'

export const FUEL_TYPE_LABELS: Record<FuelTypeCode, string> = {
  diesel: 'Diesel',
  benzene_95: 'Benzene 95',
  benzene_97: 'Benzene 97',
}

/**
 * Gets display label for fuel type
 */
export function getFuelLabel(fuelType: string | null | undefined): string {
  if (!fuelType) return 'Unknown'
  return FUEL_TYPE_LABELS[fuelType as FuelTypeCode] || fuelType
}

/**
 * Normalizes fuel type string to standardized code
 */
export function normalizeFuelType(fuelType: string | null | undefined): FuelTypeCode | null {
  if (!fuelType) return null
  
  const normalized = fuelType.trim().toLowerCase()
  
  if (normalized === 'diesel') return 'diesel'
  if (normalized === 'benzene_95' || normalized === 'benzene 95') return 'benzene_95'
  if (normalized === 'benzene_97' || normalized === 'benzene 97') return 'benzene_97'
  
  // Legacy mappings
  if (normalized === 'petrol') return 'benzene_95'
  if (normalized === 'premium') return 'benzene_97'
  
  return null
}

/**
 * Checks if a fuel type is valid
 */
export function isValidFuelType(fuelType: string | null | undefined): boolean {
  if (!fuelType) return false
  return ['diesel', 'benzene_95', 'benzene_97'].includes(fuelType)
}
