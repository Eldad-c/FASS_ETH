/**
 * Fuel type mapping helpers
 * Maps between database fuel types and TypeScript types
 */

export type DatabaseFuelType = 'Benzene 95' | 'Benzene 97' | 'Diesel' | 'Kerosene'
export type AppFuelType = 'petrol' | 'diesel' | 'premium'

/**
 * Maps database fuel type to app fuel type
 */
export function mapDatabaseFuelToApp(dbFuel: string | null | undefined): AppFuelType | null {
  if (!dbFuel) return null
  
  const normalized = dbFuel.trim()
  if (normalized === 'Benzene 95' || normalized === 'Benzene 97') {
    return 'petrol'
  }
  if (normalized === 'Diesel') {
    return 'diesel'
  }
  if (normalized === 'Kerosene') {
    return 'premium'
  }
  
  // Fallback: try direct match
  if (['petrol', 'diesel', 'premium'].includes(normalized.toLowerCase())) {
    return normalized.toLowerCase() as AppFuelType
  }
  
  return null
}

/**
 * Maps app fuel type to database fuel type
 */
export function mapAppFuelToDatabase(appFuel: AppFuelType): DatabaseFuelType {
  switch (appFuel) {
    case 'petrol':
      return 'Benzene 95' // Default to 95, could be made configurable
    case 'diesel':
      return 'Diesel'
    case 'premium':
      return 'Benzene 97'
    default:
      return 'Benzene 95'
  }
}
