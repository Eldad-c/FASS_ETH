'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Droplet, Flame, Star } from 'lucide-react'

const fuelTypes = [
  { value: 'all', label: 'All Fuels', icon: Droplet },
  { value: 'petrol', label: 'Petrol', icon: Flame },
  { value: 'diesel', label: 'Diesel', icon: Droplet },
  { value: 'premium', label: 'Premium', icon: Star },
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
    <div className="flex flex-wrap gap-2">
      {fuelTypes.map((fuel) => {
        const Icon = fuel.icon
        const isActive = currentFilter === fuel.value
        return (
          <Button
            key={fuel.value}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange(fuel.value)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {fuel.label}
          </Button>
        )
      })}
    </div>
  )
}
