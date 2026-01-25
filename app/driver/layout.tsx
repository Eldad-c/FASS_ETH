import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isDriver } from '@/lib/role-helpers'

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  if (!isDriver(profile.role)) {
    redirect('/')
  }

  return <>{children}</>
}
