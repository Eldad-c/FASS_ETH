import React from "react"
import { LogisticsSidebar } from '@/components/logistics/logistics-sidebar'

export default async function LogisticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create a dummy profile for the sidebar since no auth is required
  const dummyProfile = {
    id: 'demo-user',
    email: 'demo@example.com',
    full_name: 'Demo User',
    role: 'logistics',
    assigned_station_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen flex bg-background">
      <LogisticsSidebar profile={dummyProfile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
