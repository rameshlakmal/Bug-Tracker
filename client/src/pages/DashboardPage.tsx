import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import type { Project, Sprint, SummaryResponse, TrendPoint } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts'
import { PRIORITY_KEYS, PRIORITY_LABELS, SEVERITY_KEYS } from '@/constants'

function pickDefaultSprintId(sprints: Sprint[]): number | null {
  if (!sprints.length) return null
  return sprints[sprints.length - 1]!.id
}

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [sprintId, setSprintId] = useState<number | null>(null)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [trends, setTrends] = useState<TrendPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listProjects()
      .then((p) => {
        const active = p.filter((x) => x.isActive)
        setProjects(active)
        setProjectId(active.length ? active[0]!.id : null)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!projectId) {
      setSprints([])
      setSprintId(null)
      setTrends([])
      return
    }
    setError(null)
    Promise.all([api.listProjectSprints(projectId), api.trends(projectId)])
      .then(([sp, t]) => {
        const activeSprints = sp.filter((x) => x.isActive)
        setSprints(activeSprints)
        setSprintId(pickDefaultSprintId(activeSprints))
        setTrends(t)
      })
      .catch((e) => setError(e.message))
  }, [projectId])

  useEffect(() => {
    if (!projectId || !sprintId) {
      setSummary(null)
      return
    }
    setError(null)
    api
      .summary(projectId, sprintId)
      .then(setSummary)
      .catch((e) => setError(e.message))
  }, [projectId, sprintId])

  const selectedSprint = useMemo(() => sprints.find((s) => s.id === sprintId) || null, [sprints, sprintId])

  const cards = useMemo(() => {
    if (!summary) return null
    const sprintTotal = summary.sprintTotal
    const suggestions = summary.totals.suggestions
    const criticalHigh = (summary.totals.severity.CRITICAL || 0) + (summary.totals.severity.HIGH || 0)
    const activeDevs = summary.rows.length
    return { sprintTotal, suggestions, criticalHigh, activeDevs }
  }, [summary])

  const trendData = useMemo(
    () => trends.map((p) => ({ label: p.label, total: p.priorityTotal })),
    [trends]
  )

  const trendConfig: ChartConfig = {
    total: { label: 'Sprint total', color: 'var(--chart-1)' },
  }

  const priorityBarData = useMemo(() => {
    if (!summary) return []
    return PRIORITY_KEYS.map((k) => ({ name: PRIORITY_LABELS[k], count: summary.totals.priority[k] ?? 0 }))
  }, [summary])

  const priorityConfig: ChartConfig = {
    count: { label: 'Count', color: 'var(--chart-2)' },
  }

  const severityMix = useMemo(() => {
    if (!summary) return null
    const s = summary.totals.severity
    const total = SEVERITY_KEYS.reduce((a, k) => a + (s[k] ?? 0), 0)
    return { total, critical: s.CRITICAL ?? 0, high: s.HIGH ?? 0 }
  }, [summary])

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Quick view of sprint totals and trends.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4">
            <div className="grid w-full gap-2 sm:w-auto">
              <Label>Project</Label>
              <Select value={projectId ? String(projectId) : undefined} onValueChange={(v) => setProjectId(Number(v) || null)}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full gap-2 sm:w-auto">
              <Label>Sprint</Label>
              <Select value={sprintId ? String(sprintId) : undefined} onValueChange={(v) => setSprintId(Number(v) || null)}>
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      {summary && cards && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>{selectedSprint?.label || 'Selected Sprint'}</CardDescription>
              <CardTitle className="text-3xl">{cards.sprintTotal}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Sprint total (Priority sum)</CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Suggestions</CardDescription>
              <CardTitle className="text-3xl">{cards.suggestions}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Total suggestions logged</CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Critical + High</CardDescription>
              <CardTitle className="text-3xl">{cards.criticalHigh}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">From Severity counts</CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardDescription>Developers</CardDescription>
              <CardTitle className="text-3xl">{cards.activeDevs}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">Active devs in this sprint view</CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sprint Trend</CardTitle>
            <CardDescription>Total defects per sprint (Priority total)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-[320px] w-full">
              <LineChart data={trendData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line
                  dataKey="total"
                  type="monotone"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Selected sprint totals by priority</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={priorityConfig} className="h-[320px] w-full">
              <BarChart data={priorityBarData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
            {severityMix && (
              <div className="mt-3 text-xs text-muted-foreground">
                Severity total: {severityMix.total} (Critical: {severityMix.critical}, High: {severityMix.high})
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
