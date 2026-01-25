import Link from 'next/link'
import { Fuel } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Fuel className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">TotalEnergiesEthiopia</span>
                <span className="text-xs text-muted-foreground">Fuel Availability System</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time fuel availability tracking across Addis Ababa.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold">Public</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Find Fuel</Link>
              <Link href="/report" className="hover:text-foreground transition-colors">Report Status</Link>
              <Link href="/subscribe" className="hover:text-foreground transition-colors">Subscribe to Alerts</Link>
            </nav>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold">Portals</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/staff" className="hover:text-foreground transition-colors">Staff Portal</Link>
              <Link href="/admin" className="hover:text-foreground transition-colors">Admin Console</Link>
              <Link href="/logistics" className="hover:text-foreground transition-colors">Logistics Hub</Link>
              <Link href="/driver" className="hover:text-foreground transition-colors">Driver App</Link>
            </nav>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>Addis Ababa, Ethiopia</p>
              <p>support@totalenergies.et</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            January 2026 - TotalEnergiesEthiopia Fuel Availability System
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by Gebeta Maps
          </p>
        </div>
      </div>
    </footer>
  )
}
