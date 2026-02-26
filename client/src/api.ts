import type { Developer, FeatureTotalsRow, Project, Sprint, SummaryResponse, TrendPoint } from './types'

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => json<{ ok: boolean }>('/api/health'),

  listDevelopers: () => json<Developer[]>('/api/developers'),
  createDeveloper: (data: { name: string; team?: string }) =>
    json<Developer>('/api/developers', { method: 'POST', body: JSON.stringify(data) }),
  updateDeveloper: (id: number, data: Partial<Pick<Developer, 'name' | 'team' | 'isActive'>>) =>
    json<Developer>(`/api/developers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDeveloper: (id: number) => json<{ ok: boolean }>(`/api/developers/${id}`, { method: 'DELETE' }),

  listProjects: () => json<Project[]>('/api/projects'),
  createProject: (data: { name: string }) =>
    json<Project & { sprints?: Sprint[] }>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: number, data: Partial<Pick<Project, 'name' | 'isActive'>>) =>
    json<Project>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: number) => json<{ ok: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

  listProjectSprints: (projectId: number) => json<Sprint[]>(`/api/projects/${projectId}/sprints`),
  createSprint: (projectId: number, data: { label: string; startDate?: string; endDate?: string }) =>
    json<Sprint>(`/api/projects/${projectId}/sprints`, { method: 'POST', body: JSON.stringify(data) }),
  updateSprint: (id: number, data: Partial<Pick<Sprint, 'label' | 'isActive' | 'startDate' | 'endDate'>>) =>
    json<Sprint>(`/api/sprints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSprint: (id: number) => json<{ ok: boolean }>(`/api/sprints/${id}`, { method: 'DELETE' }),

  listProjectDevelopers: (projectId: number) => json<Developer[]>(`/api/projects/${projectId}/developers`),
  assignDeveloperToProject: (projectId: number, developerId: number) =>
    json<{ ok: boolean }>(`/api/projects/${projectId}/developers`, {
      method: 'POST',
      body: JSON.stringify({ developerId }),
    }),
  removeDeveloperFromProject: (projectId: number, developerId: number) =>
    json<{ ok: boolean }>(`/api/projects/${projectId}/developers/${developerId}`, { method: 'DELETE' }),

  bulkUpsertEntries: (data: {
    projectId: number
    sprintId: number
    featureKey?: string
    entries: Array<{ developerId: number; metricType: string; metricKey: string; count: number }>
  }) => json<{ ok: boolean }>('/api/entries/bulk', { method: 'POST', body: JSON.stringify(data) }),

  summary: (projectId: number, sprintId: number, featureKey?: string) => {
    const qs = new URLSearchParams({ projectId: String(projectId), sprintId: String(sprintId) })
    if (featureKey !== undefined) qs.set('featureKey', featureKey)
    return json<SummaryResponse>(`/api/reports/summary?${qs.toString()}`)
  },
  trends: (projectId: number) => json<TrendPoint[]>(`/api/reports/trends?projectId=${projectId}`),

  featureKeys: (projectId: number, sprintId: number) =>
    json<string[]>(`/api/reports/feature-keys?projectId=${projectId}&sprintId=${sprintId}`),
  byFeature: (projectId: number, sprintId: number) =>
    json<FeatureTotalsRow[]>(`/api/reports/by-feature?projectId=${projectId}&sprintId=${sprintId}`),
}
