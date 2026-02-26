export type Developer = {
  id: number
  name: string
  team: string | null
  isActive: boolean
}

export type Project = {
  id: number
  name: string
  isActive: boolean
}

export type Sprint = {
  id: number
  label: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  projectId: number
}

export type MetricType = 'PRIORITY' | 'SEVERITY' | 'STATUS' | 'OTHER'

export type SummaryRow = {
  developerId: number
  name: string
  priority: Record<string, number>
  severity: Record<string, number>
  status: Record<string, number>
  suggestions: number
  totals: {
    priority: number
    severity: number
    status: number
  }
}

export type SummaryResponse = {
  project: Project
  sprint: Sprint
  rows: SummaryRow[]
  totals: {
    priority: Record<string, number>
    severity: Record<string, number>
    status: Record<string, number>
    suggestions: number
  }
  sprintTotal: number
  note?: string
}

export type TrendPoint = {
  sprintId: number
  label: string
  priorityTotal: number
  severityTotal: number
  statusTotal: number
  suggestionsTotal: number
}

export type FeatureTotalsRow = {
  featureKey: string
  priority: Record<string, number>
  severity: Record<string, number>
  status: Record<string, number>
  suggestions: number
  totals: {
    priority: number
    severity: number
    status: number
  }
  sprintTotal: number
}
