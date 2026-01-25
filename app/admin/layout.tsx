import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { isAdmin } from '@/lib/role-helpers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  if (!isAdmin(profile.role)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar profile={profile} />
      <div className="flex-1 flex flex-col lg:ml-64">{children}</div>
    </div>
  )
}
