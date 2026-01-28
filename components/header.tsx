'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Fuel, Menu, X, MapPin } from 'lucide-react'
import { useState } from 'react'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary transition-transform duration-150 group-hover:scale-105">
              <Fuel className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground leading-tight tracking-tight">
                TotalEnergies
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                Ethiopia
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Button asChild variant={isActive('/') ? 'secondary' : 'ghost'} size="sm" className="text-sm">
              <Link href="/">
                <MapPin className="h-4 w-4 mr-1" />
                Find Fuel
              </Link>
            </Button>
            <Button asChild variant={isActive('/report') ? 'secondary' : 'ghost'} size="sm" className="text-sm">
              <Link href="/report">Report Status</Link>
            </Button>
            <Button asChild variant={isActive('/subscribe') ? 'secondary' : 'ghost'} size="sm" className="text-sm">
              <Link href="/subscribe">Alerts</Link>
            </Button>
            <LanguageSwitcher />
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              <Button
                asChild
                variant={isActive('/') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  Find Fuel
                </Link>
              </Button>
              <Button
                asChild
                variant={isActive('/report') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <Link href="/report" onClick={() => setMobileMenuOpen(false)}>
                  Report Status
                </Link>
              </Button>
              <Button
                asChild
                variant={isActive('/subscribe') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
              >
                <Link href="/subscribe" onClick={() => setMobileMenuOpen(false)}>
                  Alerts
                </Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
