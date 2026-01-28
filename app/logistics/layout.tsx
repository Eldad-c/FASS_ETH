import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Logistics Manager - FASS',
  description: 'Real-time fleet tracking and route management for TotalEnergies fuel deliveries',
}

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
