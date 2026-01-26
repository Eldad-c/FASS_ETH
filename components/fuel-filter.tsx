'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Droplets, Fuel, Gauge, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

// Fuel types per SDS: Diesel, Benzene 95, Benzene 97
const fuelTypes = [
  { 
    value: 'all', 
    label: 'All Fuels', 
    icon: Filter,
    color: 'bg-muted hover:bg-muted/80 text-foreground',
    activeColor: 'bg-primary text-primary-foreground',
  },
  { 
    value: 'diesel', 
    label: 'Diesel', 
    icon: Droplets,
    description: 'Standard diesel fuel',
    color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400',
    activeColor: 'bg-blue-500 text-white',
  },
  { 
    value: 'benzene_95', 
    label: 'Benzene 95', 
    icon: Fuel,
    description: 'Regular unleaded petrol',
    color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-400',
    activeColor: 'bg-orange-500 text-white',
  },
  { 
    value: 'benzene_97', 
    label: 'Benzene 97', 
    icon: Gauge,
    description: 'Premium high octane',
    color: 'bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400',
    activeColor: 'bg-red-600 text-white',
  },
]

export function FuelFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get('fuel') || 'all'

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('fuel')
    } else {
      params.set('fuel', value)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Filter by fuel type</p>
      <div className="flex flex-wrap gap-2">
        {fuelTypes.map((fuel) => {
          const Icon = fuel.icon
          const isActive = currentFilter === fuel.value
          return (
            <button
              key={fuel.value}
              type="button"
              onClick={() => handleFilterChange(fuel.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'border border-transparent',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'active:scale-[0.98]',
                isActive ? fuel.activeColor : fuel.color,
                isActive && 'shadow-md'
              )}
              aria-pressed={isActive}
            >
              <Icon className="h-4 w-4" />
              <span>{fuel.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
