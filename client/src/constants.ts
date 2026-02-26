export const PRIORITY_KEYS = ['IMMEDIATE', 'HIGH', 'MEDIUM', 'LOW'] as const
export const SEVERITY_KEYS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const
export const STATUS_KEYS = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSE', 'REOPEN', 'ON_HOLD'] as const

export const PRIORITY_LABELS: Record<(typeof PRIORITY_KEYS)[number], string> = {
  IMMEDIATE: 'Immediate',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const SEVERITY_LABELS: Record<(typeof SEVERITY_KEYS)[number], string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export const STATUS_LABELS: Record<(typeof STATUS_KEYS)[number], string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSE: 'Close',
  REOPEN: 'Reopen',
  ON_HOLD: 'On hold',
}
