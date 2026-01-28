import React from "react"
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create a dummy profile for the sidebar since no auth is required
  const dummyProfile = {
    id: 'demo-user',
    email: 'demo@example.com',
    full_name: 'Demo User',
    role: 'admin',
    assigned_station_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar profile={dummyProfile} />
      <div className="flex-1 flex flex-col lg:ml-64">{children}</div>
    </div>
  )
}
