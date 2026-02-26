import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import { PRIORITY_KEYS, PRIORITY_LABELS, SEVERITY_KEYS, SEVERITY_LABELS, STATUS_KEYS, STATUS_LABELS } from '@/constants'
import type { Developer, Project, Sprint, SummaryResponse } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function numberOrZero(v: string) {
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function EntryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [sprintId, setSprintId] = useState<number | null>(null)

  const [featureKey, setFeatureKey] = useState('')
  const [featureKeys, setFeatureKeys] = useState<string[]>([])

  const [developers, setDevelopers] = useState<Developer[]>([])
  const [developerId, setDeveloperId] = useState<number | null>(null)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)

  const [priority, setPriority] = useState<Record<string, number>>({})
  const [severity, setSeverity] = useState<Record<string, number>>({})
  const [status, setStatus] = useState<Record<string, number>>({})
  const [suggestions, setSuggestions] = useState(0)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const defaultSprintId = useMemo(() => {
    const byLabel = sprints.find((s) => s.label.trim().toLowerCase() === 'default')
    return byLabel?.id ?? (sprints.length ? sprints[sprints.length - 1]!.id : null)
  }, [sprints])

  const effectiveSprintId = sprintId ?? defaultSprintId

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
    Promise.all([api.listProjectSprints(projectId), api.listProjectDevelopers(projectId)])
      .then(([sp, devs]) => {
        const activeSprints = sp.filter((x) => x.isActive)
        setSprints(activeSprints)
        setDevelopers(devs.filter((d) => d.isActive))

        const defaultSprint = activeSprints.find((s) => s.label.trim().toLowerCase() === 'default')
        setSprintId(defaultSprint ? null : activeSprints.length ? activeSprints[activeSprints.length - 1]!.id : null)
        const activeDevs = devs.filter((d) => d.isActive)
        setDeveloperId(activeDevs.length ? activeDevs[0]!.id : null)
        setFeatureKey('')
      })
      .catch((e) => setError(e.message))
  }, [projectId])

  useEffect(() => {
    if (!projectId || !effectiveSprintId) {
      setSummary(null)
      return
    }
    setError(null)
    api
      .summary(projectId, effectiveSprintId, featureKey.trim())
      .then((s) => setSummary(s))
      .catch((e) => setError(e.message))
  }, [projectId, effectiveSprintId, featureKey])

  useEffect(() => {
    if (!projectId || !effectiveSprintId) {
      setFeatureKeys([])
      return
    }
    api
      .featureKeys(projectId, effectiveSprintId)
      .then(setFeatureKeys)
      .catch(() => setFeatureKeys([]))
  }, [projectId, effectiveSprintId])

  const selectedRow = useMemo(() => {
    if (!summary || !developerId) return null
    return summary.rows.find((r) => r.developerId === developerId) || null
  }, [summary, developerId])

  useEffect(() => {
    const pri = Object.fromEntries(PRIORITY_KEYS.map((k) => [k, 0]))
    const sev = Object.fromEntries(SEVERITY_KEYS.map((k) => [k, 0]))
    const st = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]))

    if (selectedRow) {
      for (const k of PRIORITY_KEYS) pri[k] = selectedRow.priority[k] || 0
      for (const k of SEVERITY_KEYS) sev[k] = selectedRow.severity[k] || 0
      for (const k of STATUS_KEYS) st[k] = selectedRow.status[k] || 0
      setSuggestions(selectedRow.suggestions || 0)
    } else {
      setSuggestions(0)
    }

    setPriority(pri)
    setSeverity(sev)
    setStatus(st)
    setSavedAt(null)
  }, [selectedRow])

  const priorityTotal = useMemo(() => PRIORITY_KEYS.reduce((a, k) => a + (priority[k] || 0), 0), [priority])
  const severityTotal = useMemo(() => SEVERITY_KEYS.reduce((a, k) => a + (severity[k] || 0), 0), [severity])
  const statusTotal = useMemo(() => STATUS_KEYS.reduce((a, k) => a + (status[k] || 0), 0), [status])

  async function save() {
    if (!projectId || !effectiveSprintId || !developerId) return
    setBusy(true)
    setError(null)
    try {
      const entries = [
        ...PRIORITY_KEYS.map((k) => ({ developerId, metricType: 'PRIORITY', metricKey: k, count: priority[k] || 0 })),
        ...SEVERITY_KEYS.map((k) => ({ developerId, metricType: 'SEVERITY', metricKey: k, count: severity[k] || 0 })),
        ...STATUS_KEYS.map((k) => ({ developerId, metricType: 'STATUS', metricKey: k, count: status[k] || 0 })),
        { developerId, metricType: 'OTHER', metricKey: 'SUGGESTIONS', count: suggestions || 0 },
      ]

      await api.bulkUpsertEntries({ projectId, sprintId: effectiveSprintId, featureKey: featureKey.trim(), entries })
      const s = await api.summary(projectId, effectiveSprintId, featureKey.trim())
      setSummary(s)
      setSavedAt(new Date().toLocaleString())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Entry</CardTitle>
            <CardDescription>
              Enter counts for the selected sprint + developer. Totals are calculated automatically.
            </CardDescription>
          </div>
          <Button className="w-full sm:w-auto" disabled={busy || !projectId || !effectiveSprintId || !developerId} onClick={save}>
            Save
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4">
            <div className="grid w-full gap-2 sm:w-auto">
              <Label>Project</Label>
              <Select
                value={projectId ? String(projectId) : undefined}
                onValueChange={(v) => setProjectId(Number(v) || null)}
              >
                <SelectTrigger className="w-full sm:w-[260px]">
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
              <Label>Sprint <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select
                value={sprintId ? String(sprintId) : defaultSprintId ? '__default__' : undefined}
                onValueChange={(v) => setSprintId(v === '__default__' ? null : Number(v) || null)}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {defaultSprintId && (
                    <SelectItem value="__default__">Default</SelectItem>
                  )}
                  {sprints.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full gap-2 sm:w-auto">
              <Label>Feature / Module <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={featureKey}
                list="feature-keys"
                placeholder="e.g. Login, Payments, Reports"
                onChange={(e) => setFeatureKey(e.target.value)}
              />
              {featureKeys.length > 0 && (
                <datalist id="feature-keys">
                  {featureKeys.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              )}
            </div>

            <div className="grid w-full gap-2 sm:w-auto">
              <Label>Developer</Label>
              <Select
                value={developerId ? String(developerId) : undefined}
                onValueChange={(v) => setDeveloperId(Number(v) || null)}
              >
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue placeholder="Select developer" />
                </SelectTrigger>
                <SelectContent>
                  {developers.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {projectId && developers.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No developers assigned to this project yet. Assign developers in Admin {'>'} Projects.
            </div>
          )}

          {savedAt && <div className="text-sm text-emerald-400">Saved ({savedAt})</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{`Defects by Priority (Total: ${priorityTotal})`}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRIORITY_KEYS.map((k) => (
              <div key={k} className="grid gap-2">
                <Label>{PRIORITY_LABELS[k]}</Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={String(priority[k] ?? 0)}
                  onChange={(e) => setPriority((p) => ({ ...p, [k]: numberOrZero(e.target.value) }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{`Defects by Severity (Total: ${severityTotal})`}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SEVERITY_KEYS.map((k) => (
              <div key={k} className="grid gap-2">
                <Label>{SEVERITY_LABELS[k]}</Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={String(severity[k] ?? 0)}
                  onChange={(e) => setSeverity((p) => ({ ...p, [k]: numberOrZero(e.target.value) }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{`Overall Defect Status Summary (Total: ${statusTotal})`}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STATUS_KEYS.map((k) => (
              <div key={k} className="grid gap-2">
                <Label>{STATUS_LABELS[k]}</Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={String(status[k] ?? 0)}
                  onChange={(e) => setStatus((p) => ({ ...p, [k]: numberOrZero(e.target.value) }))}
                />
              </div>
            ))}

            <div className="grid gap-2">
              <Label>Suggestions</Label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={String(suggestions)}
                onChange={(e) => setSuggestions(numberOrZero(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
