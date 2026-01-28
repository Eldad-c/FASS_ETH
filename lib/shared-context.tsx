'use client'

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'

export interface Report {
  id: string
  reportedBy: string
  description: string
  severity: 'high' | 'medium' | 'low'
  type: string
  status: 'pending' | 'confirmed'
  createdAt: string
  confirmedAt?: string
}

export interface RouteIssue {
  id: string
  tankerId: string
  issue: string
  timestamp: string
  resolved: boolean
}

interface SharedContextType {
  // Reports management
  reports: Report[]
  addReport: (report: Report) => void
  confirmReport: (reportId: string) => void
  deleteReport: (reportId: string) => void
  
  // Route issues management
  routeIssues: RouteIssue[]
  addRouteIssue: (issue: RouteIssue) => void
  
  // Fuel status updates
  fuelUpdates: Map<string, any>
  setFuelUpdate: (key: string, data: any) => void
  
  // Delivery updates
  deliveryUpdates: Map<string, any>
  setDeliveryUpdate: (key: string, data: any) => void
}

const SharedContext = createContext<SharedContextType | undefined>(undefined)

export function SharedProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>([])
  const [routeIssues, setRouteIssues] = useState<RouteIssue[]>([])
  const [fuelUpdates, setFuelUpdatesMap] = useState<Map<string, any>>(new Map())
  const [deliveryUpdates, setDeliveryUpdatesMap] = useState<Map<string, any>>(new Map())
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<Error | null>(null)

  // Safely initialize context after hydration
  useEffect(() => {
    try {
      setIsInitialized(true)
    } catch (err) {
      setInitError(err instanceof Error ? err : new Error('Unknown initialization error'))
    }
  }, [])

  const addReport = useCallback((report: Report) => {
    setReports((prev) => [report, ...prev])
  }, [])

  const confirmReport = useCallback((reportId: string) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? { ...report, status: 'confirmed', confirmedAt: new Date().toISOString() }
          : report
      )
    )
  }, [])

  const deleteReport = useCallback((reportId: string) => {
    setReports((prev) => prev.filter((report) => report.id !== reportId))
  }, [])

  const addRouteIssue = useCallback((issue: RouteIssue) => {
    setRouteIssues((prev) => [issue, ...prev])
  }, [])

  const setFuelUpdate = useCallback((key: string, data: any) => {
    setFuelUpdatesMap((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, data)
      return newMap
    })
  }, [])

  const setDeliveryUpdate = useCallback((key: string, data: any) => {
    setDeliveryUpdatesMap((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, data)
      return newMap
    })
  }, [])

  // Don't render context until client is hydrated, or return safely on error
  if (!isInitialized) {
    return <>{children}</>
  }

  if (initError) {
    console.error('[v0] SharedProvider initialization error:', initError)
    // Return children without context on error
    return <>{children}</>
  }

  return (
    <SharedContext.Provider
      value={{
        reports,
        addReport,
        confirmReport,
        deleteReport,
        routeIssues,
        addRouteIssue,
        fuelUpdates,
        setFuelUpdate,
        deliveryUpdates,
        setDeliveryUpdate,
      }}
    >
      {children}
    </SharedContext.Provider>
  )
}

export function useShared() {
  const context = useContext(SharedContext)
  if (!context) {
    // Return a safe fallback during server-side rendering or before hydration
    return {
      reports: [],
      addReport: () => {},
      confirmReport: () => {},
      deleteReport: () => {},
      routeIssues: [],
      addRouteIssue: () => {},
      fuelUpdates: new Map(),
      setFuelUpdate: () => {},
      deliveryUpdates: new Map(),
      setDeliveryUpdate: () => {},
    }
  }
  return context
}
