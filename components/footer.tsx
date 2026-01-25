import { Fuel } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Fuel className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">TotalEnergies</span>
              <span className="text-xs text-muted-foreground">Fuel Availability System</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">January 2026</p>
        </div>
      </div>
    </footer>
  )
}
