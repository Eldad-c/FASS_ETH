import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogisticsSidebar } from '@/components/logistics/logistics-sidebar'
import { hasRole } from '@/lib/role-helpers'

export default async function LogisticsLayout({
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

  if (!hasRole(profile.role, ['admin', 'logistics'])) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex bg-background">
      <LogisticsSidebar profile={profile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
