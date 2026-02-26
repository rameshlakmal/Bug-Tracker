import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import { PRIORITY_KEYS, PRIORITY_LABELS, SEVERITY_KEYS, SEVERITY_LABELS, STATUS_KEYS, STATUS_LABELS } from '@/constants'
import type { Project, Sprint, SummaryResponse } from '@/types'
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

export function ReportPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [sprintId, setSprintId] = useState<number | null>(null)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [featureKey, setFeatureKey] = useState<string | null>(null)
  const [featureKeys, setFeatureKeys] = useState<string[]>([])
  const [byFeature, setByFeature] = useState<Array<{ featureKey: string; priority: Record<string, number>; sprintTotal: number }> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listProjects()
      .then((p) => {
        const active = p.filter((x) => x.isActive)
        setProjects(active)
        if (active.length) setProjectId(active[0]!.id)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!projectId) return
    setError(null)
    api.listProjectSprints(projectId)
      .then((sp) => {
        const activeSprints = sp.filter((x) => x.isActive)
        setSprints(activeSprints)
        setSprintId(activeSprints.length ? activeSprints[activeSprints.length - 1]!.id : null)
        setFeatureKey(null)
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
      .summary(projectId, sprintId, featureKey === null ? undefined : featureKey)
      .then(setSummary)
      .catch((e) => setError(e.message))
  }, [projectId, sprintId, featureKey])

  useEffect(() => {
    if (!projectId || !sprintId) {
      setFeatureKeys([])
      setByFeature(null)
      return
    }

    Promise.all([
      api.featureKeys(projectId, sprintId),
      api.byFeature(projectId, sprintId),
    ])
      .then(([keys, rows]) => {
        setFeatureKeys(keys)
        setByFeature(rows.map((r) => ({ featureKey: r.featureKey, priority: r.priority, sprintTotal: r.sprintTotal })))
      })
      .catch(() => {
        setFeatureKeys([])
        setByFeature(null)
      })
  }, [projectId, sprintId])

  const totalsLabel = useMemo(() => (summary ? `Sprint Total (Priority): ${summary.sprintTotal}` : ''), [summary])

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-baseline justify-between gap-2">
            <span>Report</span>
            <span className="text-sm font-normal text-muted-foreground">{totalsLabel}</span>
          </CardTitle>
          {summary?.note && <CardDescription>{summary.note}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-nowrap gap-4 overflow-x-auto pb-1">
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

            <div className="grid min-w-[220px] shrink-0 gap-2">
              <Label>Sprint</Label>
              <Select
                value={sprintId ? String(sprintId) : undefined}
                onValueChange={(v) => setSprintId(Number(v) || null)}
              >
                <SelectTrigger className="w-[220px]">
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

            <div className="grid min-w-[240px] shrink-0 gap-2">
              <Label>Feature / Module</Label>
              <Select
                value={featureKey === null ? '__all__' : featureKey === '' ? '__unassigned__' : featureKey}
                onValueChange={(v) => setFeatureKey(v === '__all__' ? null : v === '__unassigned__' ? '' : v)}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="All features" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All features</SelectItem>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {featureKeys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      {summary && (
        <>
          {byFeature && (
            <Card>
              <CardHeader>
                <CardTitle>Defects by Feature (Priority)</CardTitle>
                <CardDescription>Click a feature to filter the report.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border bg-background/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        {PRIORITY_KEYS.map((k) => (
                          <TableHead key={k} data-priority={k} className="report-level-th text-foreground">
                            {PRIORITY_LABELS[k]}
                          </TableHead>
                        ))}
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byFeature.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={PRIORITY_KEYS.length + 2} className="text-center text-muted-foreground">
                            No feature entries yet.
                          </TableCell>
                        </TableRow>
                      )}
                      {byFeature.map((r) => (
                        <TableRow key={r.featureKey || '__unassigned__'}>
                          <TableCell className="font-medium">
                            <button
                              type="button"
                              className="text-left underline-offset-4 hover:underline"
                              onClick={() => setFeatureKey(r.featureKey)}
                            >
                              {r.featureKey || 'Unassigned'}
                            </button>
                          </TableCell>
                          {PRIORITY_KEYS.map((k) => (
                            <TableCell key={k}>{r.priority[k] ?? 0}</TableCell>
                          ))}
                          <TableCell className="font-semibold">{r.sprintTotal ?? 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Defects by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border bg-background/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dev Name</TableHead>
                      {PRIORITY_KEYS.map((k) => (
                        <TableHead key={k} data-priority={k} className="report-level-th text-foreground">
                          {PRIORITY_LABELS[k]}
                        </TableHead>
                      ))}
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.rows.map((r) => (
                      <TableRow key={r.developerId}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        {PRIORITY_KEYS.map((k) => (
                          <TableCell key={k}>{r.priority[k] ?? 0}</TableCell>
                        ))}
                        <TableCell className="font-semibold">{r.totals.priority}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell className="font-semibold">Total</TableCell>
                      {PRIORITY_KEYS.map((k) => (
                        <TableCell key={k} className="font-semibold">
                          {summary.totals.priority[k] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell className="font-semibold">{summary.totals.priority.Total ?? summary.sprintTotal}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Defects by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border bg-background/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dev Name</TableHead>
                      {SEVERITY_KEYS.map((k) => (
                        <TableHead key={k} data-severity={k} className="report-level-th text-foreground">
                          {SEVERITY_LABELS[k]}
                        </TableHead>
                      ))}
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.rows.map((r) => (
                      <TableRow key={r.developerId}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        {SEVERITY_KEYS.map((k) => (
                          <TableCell key={k}>{r.severity[k] ?? 0}</TableCell>
                        ))}
                        <TableCell className="font-semibold">{r.totals.severity}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell className="font-semibold">Total</TableCell>
                      {SEVERITY_KEYS.map((k) => (
                        <TableCell key={k} className="font-semibold">
                          {summary.totals.severity[k] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell className="font-semibold">{summary.totals.severity.Total ?? 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Defect Status Summary</CardTitle>
              <CardDescription>
                Tip: use Trends to see the sprint-wise totals table (your "Release/Sprint/Milestone wise Defect Summary").
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border bg-background/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dev Name</TableHead>
                      {STATUS_KEYS.map((k) => (
                        <TableHead key={k}>{STATUS_LABELS[k]}</TableHead>
                      ))}
                      <TableHead>Total</TableHead>
                      <TableHead>Suggestions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.rows.map((r) => (
                      <TableRow key={r.developerId}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        {STATUS_KEYS.map((k) => (
                          <TableCell key={k}>{r.status[k] ?? 0}</TableCell>
                        ))}
                        <TableCell className="font-semibold">{r.totals.status}</TableCell>
                        <TableCell>{r.suggestions ?? 0}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40">
                      <TableCell className="font-semibold">Total</TableCell>
                      {STATUS_KEYS.map((k) => (
                        <TableCell key={k} className="font-semibold">
                          {summary.totals.status[k] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell className="font-semibold">{summary.totals.status.Total ?? 0}</TableCell>
                      <TableCell className="font-semibold">{summary.totals.suggestions ?? 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
