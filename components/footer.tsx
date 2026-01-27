import Link from 'next/link'
import { Fuel } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Fuel className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">TotalEnergies FASS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time fuel availability system
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold">Access</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">Staff Portal</Link>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">Admin Console</Link>
            </nav>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold">Legal</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </nav>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © 2026 TotalEnergies Ethiopia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
