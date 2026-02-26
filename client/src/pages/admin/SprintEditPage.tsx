import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '@/api'
import type { Project, Sprint } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function SprintEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isEdit = Boolean(id)

  const stateData = location.state as { sprint?: Sprint; projects?: Project[] } | null

  const [projects, setProjects] = useState<Project[]>(stateData?.projects ?? [])
  const [projectId, setProjectId] = useState<number | null>(
    stateData?.sprint?.projectId ?? null
  )
  const [label, setLabel] = useState(stateData?.sprint?.label ?? '')
  const [isActive, setIsActive] = useState(stateData?.sprint?.isActive ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length === 0) {
      api.listProjects().then(setProjects).catch((e: any) => setError(e.message))
    }
    if (isEdit && !stateData?.sprint) {
      // Fallback: try to find sprint from all projects' sprint lists
      api.listProjects().then(async (allProjects) => {
        for (const p of allProjects) {
          const sprints = await api.listProjectSprints(p.id)
          const found = sprints.find((s) => s.id === Number(id))
          if (found) {
            setLabel(found.label)
            setIsActive(found.isActive)
            setProjectId(found.projectId)
            break
          }
        }
      }).catch((e: any) => setError(e.message))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    if (!isEdit && !projectId) return
    setBusy(true)
    setError(null)
    try {
      if (isEdit) {
        await api.updateSprint(Number(id), { label: label.trim(), isActive })
      } else {
        await api.createSprint(projectId!, { label: label.trim() })
      }
      navigate('/admin/sprints')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Sprint' : 'New Sprint'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update sprint details.' : 'Add a new sprint to a project.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          {!isEdit && (
            <div className="grid gap-2">
              <Label>Project</Label>
              <Select
                value={projectId ? String(projectId) : undefined}
                onValueChange={(v) => setProjectId(Number(v))}
              >
                <SelectTrigger>
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
          )}

          <div className="grid gap-2">
            <Label htmlFor="label">Sprint Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Sprint 01"
              required
            />
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
            <Button type="submit" disabled={busy || !label.trim() || (!isEdit && !projectId)}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/sprints')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
