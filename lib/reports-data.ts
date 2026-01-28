export interface Report {
  id: string
  reportedBy: string
  type: 'issue' | 'incident' | 'concern'
  description: string
  severity: 'low' | 'medium' | 'high'
  stationId?: string
  tankerId?: string
  createdAt: string
  confirmedAt?: string
  status: 'pending' | 'confirmed' | 'resolved'
}

// Sample reports data
export const initialReports: Report[] = [
  {
    id: 'rpt-001',
    reportedBy: 'Driver Ahmed',
    type: 'issue',
    description: 'Fuel pump malfunction at Bole station - pressure gauge not reading correctly',
    severity: 'high',
    stationId: 'stn-001',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: 'pending',
  },
  {
    id: 'rpt-002',
    reportedBy: 'Staff Member Lemma',
    type: 'incident',
    description: 'Queue overflow at Sarbet station during peak hours',
    severity: 'medium',
    stationId: 'stn-002',
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    status: 'pending',
  },
  {
    id: 'rpt-003',
    reportedBy: 'Driver Kebede',
    type: 'concern',
    description: 'Pricing discrepancy noticed - Benzene 95 price mismatch',
    severity: 'low',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    status: 'pending',
  },
  {
    id: 'rpt-004',
    reportedBy: 'Driver Mohamed',
    type: 'issue',
    description: 'Tanker ET-AA-0002 brake system needs inspection',
    severity: 'high',
    tankerId: 'tnk-002',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    confirmedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    status: 'confirmed',
  },
]
