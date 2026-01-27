'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Fuel, Menu, X, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserName(profile.full_name)
          setUserRole(profile.role?.toLowerCase())
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUserName(profile.full_name)
          setUserRole(profile.role?.toLowerCase())
        }
      } else {
        setUserName(null)
        setUserRole(null)
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
    if (!userRole) return '/auth/login'
    if (userRole === 'admin') return '/admin'
    if (userRole === 'staff') return '/staff'
    if (userRole === 'it_support') return '/it-support'
    return '/'
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Fuel className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">TotalEnergies FASS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Button asChild variant={isActive('/') ? 'secondary' : 'ghost'} size="sm">
              <Link href="/">Dashboard</Link>
            </Button>
            
            {user && userRole ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="ml-2">
                    {userName || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{userName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer">
                      {userRole === 'admin' && 'Admin Console'}
                      {userRole === 'staff' && 'Staff Portal'}
                      {userRole === 'it_support' && 'IT Support'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="ml-2">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-border flex flex-col gap-2">
            <Button asChild variant={isActive('/') ? 'secondary' : 'ghost'} className="w-full justify-start" size="sm">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            </Button>
            {user ? (
              <>
                <Button asChild size="sm" className="w-full justify-start">
                  <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                    {userRole === 'admin' && 'Admin Console'}
                    {userRole === 'staff' && 'Staff Portal'}
                    {userRole === 'it_support' && 'IT Support'}
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="w-full justify-start">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
