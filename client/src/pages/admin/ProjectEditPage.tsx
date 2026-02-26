import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '@/api'
import type { Developer, Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function ProjectEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isEdit = Boolean(id)

  const projectId = useMemo(() => (isEdit ? Number(id) : null), [id, isEdit])

  const [name, setName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [allDevelopers, setAllDevelopers] = useState<Developer[]>([])
  const [selectedDeveloperIds, setSelectedDeveloperIds] = useState<number[]>([])
  const [initialDeveloperIds, setInitialDeveloperIds] = useState<number[]>([])

  const [newDevName, setNewDevName] = useState('')
  const [newDevTeam, setNewDevTeam] = useState('')
  const [devBusy, setDevBusy] = useState(false)
  const [devError, setDevError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit) return
    const stateProject = (location.state as { project?: Project } | null)?.project
    if (stateProject) {
      setName(stateProject.name)
      setIsActive(stateProject.isActive)
      return
    }
    // Fallback: load from list
    api.listProjects().then((list) => {
      const found = list.find((p) => p.id === Number(id))
      if (found) {
        setName(found.name)
        setIsActive(found.isActive)
      }
    }).catch((e: any) => setError(e.message))
  }, [id, isEdit, location.state])

  useEffect(() => {
    api
      .listDevelopers()
      .then(setAllDevelopers)
      .catch((e: any) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!projectId) return
    api
      .listProjectDevelopers(projectId)
      .then((devs) => {
        const ids = devs.map((d) => d.id)
        setSelectedDeveloperIds(ids)
        setInitialDeveloperIds(ids)
      })
      .catch((e: any) => setError(e.message))
  }, [projectId])

  function toggleDeveloper(devId: number) {
    setSelectedDeveloperIds((prev) =>
      prev.includes(devId) ? prev.filter((x) => x !== devId) : [...prev, devId]
    )
  }

  async function createDeveloperInline() {
    const nameTrimmed = newDevName.trim()
    const teamTrimmed = newDevTeam.trim()
    if (!nameTrimmed) return

    setDevBusy(true)
    setDevError(null)
    try {
      const created = await api.createDeveloper({
        name: nameTrimmed,
        team: teamTrimmed || undefined,
      })

      setAllDevelopers((prev) => {
        const next = [...prev, created]
        next.sort((a, b) => a.name.localeCompare(b.name))
        return next
      })
      setSelectedDeveloperIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]))
      setNewDevName('')
      setNewDevTeam('')
    } catch (e: any) {
      setDevError(e.message)
    } finally {
      setDevBusy(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      if (isEdit) {
        await api.updateProject(Number(id), { name: name.trim(), isActive })

        const initial = new Set(initialDeveloperIds)
        const desired = new Set(selectedDeveloperIds)
        const toAdd = [...desired].filter((x) => !initial.has(x))
        const toRemove = [...initial].filter((x) => !desired.has(x))

        for (const devId of toAdd) {
          await api.assignDeveloperToProject(Number(id), devId)
        }
        for (const devId of toRemove) {
          await api.removeDeveloperFromProject(Number(id), devId)
        }
      } else {
        const created = await api.createProject({ name: name.trim() })
        for (const devId of selectedDeveloperIds) {
          await api.assignDeveloperToProject(created.id, devId)
        }
      }
      navigate('/admin/projects')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Project' : 'New Project'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update project details.' : 'Create a new project. A default sprint is added automatically.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Project"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Developers</Label>
            <div className="text-sm text-muted-foreground">
              Select developers who belong to this project. This list is used for Entry, Report, and Trends.
            </div>
            <div className="max-h-56 overflow-auto rounded-lg border bg-background/60 p-2">
              {allDevelopers.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No developers yet.</div>
              ) : (
                <div className="grid gap-1">
                  {allDevelopers.map((d) => {
                    const checked = selectedDeveloperIds.includes(d.id)
                    return (
                      <label
                        key={d.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1 hover:bg-muted/40"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDeveloper(d.id)}
                            disabled={busy}
                          />
                          <span className="font-medium">{d.name}</span>
                          <span className="text-xs text-muted-foreground">{d.team ? d.team : '—'}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{d.isActive ? 'Active' : 'Inactive'}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>
              Create Developer <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={newDevName}
                onChange={(e) => setNewDevName(e.target.value)}
                placeholder="Developer name"
              />
              <Input
                value={newDevTeam}
                onChange={(e) => setNewDevTeam(e.target.value)}
                placeholder="Team (optional)"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={devBusy || busy || !newDevName.trim()}
                onClick={createDeveloperInline}
                className="sm:shrink-0"
              >
                Add
              </Button>
            </div>
            {devError && <div className="text-sm text-destructive">{devError}</div>}
          </div>

          {isEdit && (
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !name.trim()}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/projects')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
