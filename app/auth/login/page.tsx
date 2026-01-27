'use client'

import React from "react"
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Fuel } from 'lucide-react'
import { hasRole } from '@/lib/role-helpers'

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profileError) {
          setError(profileError.message)
          return
        }

        const role = profile?.role?.toLowerCase()
        if (role === 'admin') {
          router.push('/admin')
        } else if (role === 'staff') {
          router.push('/staff')
        } else if (role === 'logistics') {
          router.push('/logistics')
        } else if (role === 'driver') {
          router.push('/driver')
        } else {
          router.push('/')
        }
      }
    }
    checkUser()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Check if 2FA is required
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, two_factor_enabled')
          .eq('id', data.user.id)
          .maybeSingle()
        
        if (profileError) {
          throw profileError
        }

        // If 2FA is enabled for admin or manager, require verification
        if (profile?.two_factor_enabled && hasRole(profile.role, ['admin', 'manager'])) {
          setRequires2FA(true)
          setUserId(data.user.id)
          setIsLoading(false)
          return
        }

        // Redirect based on role
        const role = profile?.role?.toLowerCase()
        if (role === 'admin') {
          router.push('/admin')
        } else if (role === 'staff') {
          router.push('/staff')
        } else if (role === 'logistics') {
          router.push('/logistics')
        } else if (role === 'driver') {
          router.push('/driver')
        } else if (role === 'manager') {
          router.push('/manager')
        } else if (role === 'it_support') {
          router.push('/it-support')
        } else {
          router.push('/')
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (twoFactorToken.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFactorToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid 2FA code')
      }

      // Get user profile and redirect
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      const role = profile?.role?.toLowerCase()
      if (role === 'admin') {
        router.push('/admin')
      } else if (role === 'manager') {
        router.push('/manager')
      } else {
        router.push('/')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Fuel className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">TotalEnergiesEthiopia</span>
                <span className="text-xs text-muted-foreground">Fuel Availability System</span>
              </div>
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!requires2FA ? (
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link
                      href="/auth/sign-up"
                      className="underline underline-offset-4"
                    >
                      Sign up
                    </Link>
                  </div>
                </form>
              ) : (
                <form onSubmit={handle2FAVerification}>
                  <div className="flex flex-col gap-6">
                    <div className.tsx="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Two-factor authentication is required
                      </p>
                      <p className="text-sm font-medium mb-2">
                        Enter the 6-digit code from your authenticator app
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="2fa">2FA Code</Label>
                      <Input
                        id="2fa"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        required
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-2xl tracking-widest"
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading || twoFactorToken.length !== 6}>
                      {isLoading ? 'Verifying...' : 'Verify'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setRequires2FA(false)
                        setTwoFactorToken('')
                        setError(null)
                      }}
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
