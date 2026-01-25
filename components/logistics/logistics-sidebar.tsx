'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Fuel,
  LayoutDashboard,
  Truck,
  Route,
  MapPin,
  Package,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface LogisticsSidebarProps {
  profile: Profile
}

const navItems = [
  { href: '/logistics', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logistics/fleet', label: 'Fleet Management', icon: Truck },
  { href: '/logistics/trips', label: 'Trip Management', icon: Route },
  { href: '/logistics/deliveries', label: 'Deliveries', icon: Package },
  { href: '/logistics/tracking', label: 'Live Tracking', icon: MapPin },
  { href: '/logistics/dispatch', label: 'Dispatch Control', icon: Bell },
]

export function LogisticsSidebar({ profile }: LogisticsSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground mb-4">
          <Link href="/" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Map
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Fuel className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm">TotalEnergiesEthiopia</h1>
            <p className="text-xs text-muted-foreground">Logistics Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Button
                  asChild
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3"
                  size="sm"
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium">
              {profile.full_name?.charAt(0) || 'L'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name || 'Logistics Manager'}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          size="sm"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
