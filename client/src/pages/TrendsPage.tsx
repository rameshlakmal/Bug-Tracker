import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import type { Project, TrendPoint } from '@/types'
import { Button } from '@/components/ui/button'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

export function TrendsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [points, setPoints] = useState<TrendPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  const [showPriority, setShowPriority] = useState(true)
  const [showSeverity, setShowSeverity] = useState(true)
  const [showStatus, setShowStatus] = useState(true)

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
      setPoints([])
      return
    }
    setError(null)
    api
      .trends(projectId)
      .then(setPoints)
      .catch((e) => setError(e.message))
  }, [projectId])

  const chartData = useMemo(
    () =>
      points.map((p) => ({
        label: p.label,
        priorityTotal: p.priorityTotal,
        severityTotal: p.severityTotal,
        statusTotal: p.statusTotal,
      })),
    [points]
  )

  const chartConfig: ChartConfig = {
    priorityTotal: { label: 'Priority total', color: 'var(--chart-1)' },
    severityTotal: { label: 'Severity total', color: 'var(--chart-2)' },
    statusTotal: { label: 'Status total', color: 'var(--chart-4)' },
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
          <CardDescription>Shows sprint-wise totals. V1 sprint total = sum of all Priority counts for that sprint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-nowrap items-end gap-4 overflow-x-auto pb-1">
            <div className="grid min-w-[240px] shrink-0 gap-2">
              <Label>Project</Label>
              <Select value={projectId ? String(projectId) : undefined} onValueChange={(v) => setProjectId(Number(v) || null)}>
                <SelectTrigger className="w-[240px]">
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

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant={showPriority ? 'default' : 'outline'} onClick={() => setShowPriority((v) => !v)}>
                Priority
              </Button>
              <Button size="sm" variant={showSeverity ? 'default' : 'outline'} onClick={() => setShowSeverity((v) => !v)}>
                Severity
              </Button>
              <Button size="sm" variant={showStatus ? 'default' : 'outline'} onClick={() => setShowStatus((v) => !v)}>
                Status
              </Button>
            </div>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sprint-wise Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full sm:h-[360px]">
            <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {showPriority && (
                <Line type="monotone" dataKey="priorityTotal" stroke="var(--color-priorityTotal)" strokeWidth={2} dot={false} />
              )}
              {showSeverity && (
                <Line type="monotone" dataKey="severityTotal" stroke="var(--color-severityTotal)" strokeWidth={2} dot={false} />
              )}
              {showStatus && (
                <Line type="monotone" dataKey="statusTotal" stroke="var(--color-statusTotal)" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Release/Sprint/Milestone wise Defect Summary (V1: Sprint wise)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border bg-background/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sprint</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {points.map((p) => (
                  <TableRow key={p.sprintId}>
                    <TableCell className="font-medium">{p.label}</TableCell>
                    <TableCell>{p.priorityTotal}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40">
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="font-semibold">{points.reduce((a, p) => a + p.priorityTotal, 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
