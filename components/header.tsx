'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Fuel, Menu, X, User, LogIn, LogOut, LayoutDashboard, Truck, MapPin, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data))
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const getDashboardLink = () => {
    if (!profile) return '/auth/login'
    switch (profile.role) {
      case 'admin':
        return '/admin'
      case 'staff':
        return '/staff'
      case 'logistics':
        return '/logistics'
      case 'driver':
        return '/driver'
      default:
        return '/'
    }
  }

  const getRoleLabel = () => {
    if (!profile) return ''
    switch (profile.role) {
      case 'admin':
        return 'Administrator'
      case 'staff':
        return 'Station Staff'
      case 'logistics':
        return 'Logistics Manager'
      case 'driver':
        return 'Tanker Driver'
      default:
        return 'User'
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Fuel className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-tight">
                TotalEnergiesEthiopia
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                Fuel Availability System
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button
                variant={isActive('/') ? 'secondary' : 'ghost'}
                size="sm"
                className="text-sm"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Find Fuel
              </Button>
            </Link>
            <Link href="/report">
              <Button
                variant={isActive('/report') ? 'secondary' : 'ghost'}
                size="sm"
                className="text-sm"
              >
                Report Status
              </Button>
            </Link>
            <Link href="/subscribe">
              <Button
                variant={isActive('/subscribe') ? 'secondary' : 'ghost'}
                size="sm"
                className="text-sm"
              >
                Alerts
              </Button>
            </Link>
            {user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="ml-2">
                    <User className="h-4 w-4 mr-2" />
                    {profile.full_name || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{profile.full_name || 'User'}</span>
                      <span className="text-xs font-normal text-muted-foreground">{getRoleLabel()}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {(profile.role === 'admin' || profile.role === 'logistics') && (
                    <DropdownMenuItem asChild>
                      <Link href="/logistics" className="cursor-pointer">
                        <Truck className="h-4 w-4 mr-2" />
                        Logistics Hub
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {profile.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        System Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button variant="default" size="sm" className="ml-2">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
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
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive('/') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  Find Fuel
                </Button>
              </Link>
              <Link href="/report" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive('/report') ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  Report Status
                </Button>
              </Link>
              {user ? (
                <Link
                  href={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="default" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="default" className="w-full justify-start">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
