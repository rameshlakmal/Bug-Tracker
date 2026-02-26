import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '@/api'
import type { Developer, Project, Sprint } from '@/types'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AdminPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [projectDevelopers, setProjectDevelopers] = useState<Developer[]>([])

  const [allDevelopers, setAllDevelopers] = useState<Developer[]>([])

  const [newProjectName, setNewProjectName] = useState('')
  const [editProjectName, setEditProjectName] = useState('')
  const [newDevName, setNewDevName] = useState('')
  const [newDevTeam, setNewDevTeam] = useState('')
  const [newSprintLabel, setNewSprintLabel] = useState('')
  const [editSprintLabels, setEditSprintLabels] = useState<Record<number, string>>({})
  const [assignDeveloperId, setAssignDeveloperId] = useState<number | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function refreshProjects() {
    const p = await api.listProjects()
    const active = p.filter((x) => x.isActive)
    setProjects(active)
    if (!selectedProjectId && active.length) setSelectedProjectId(active[0]!.id)
  }

  async function refreshGlobals() {
    const devs = await api.listDevelopers()
    setAllDevelopers(devs)
  }

  async function refreshProjectScoped(projectId: number) {
    const [sp, devs] = await Promise.all([api.listProjectSprints(projectId), api.listProjectDevelopers(projectId)])
    setSprints(sp)
    setProjectDevelopers(devs)
  }

  useEffect(() => {
    Promise.all([refreshProjects(), refreshGlobals()]).catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      setSprints([])
      setProjectDevelopers([])
      return
    }
    setError(null)
    refreshProjectScoped(selectedProjectId).catch((e) => setError(e.message))
  }, [selectedProjectId])

  useEffect(() => {
    const p = projects.find((x) => x.id === selectedProjectId)
    setEditProjectName(p?.name || '')
  }, [projects, selectedProjectId])

  useEffect(() => {
    const next: Record<number, string> = {}
    for (const s of sprints) next[s.id] = s.label
    setEditSprintLabels(next)
  }, [sprints])

  const availableToAssign = useMemo(() => {
    const assigned = new Set(projectDevelopers.map((d) => d.id))
    return allDevelopers.filter((d) => d.isActive && !assigned.has(d.id))
  }, [allDevelopers, projectDevelopers])

  async function onAddProject(e: FormEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    setBusy(true)
    setError(null)
    try {
      const created = await api.createProject({ name: newProjectName.trim() })
      setNewProjectName('')
      await refreshProjects()
      setSelectedProjectId(created.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteProject() {
    if (!selectedProjectId) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteProject(selectedProjectId)
      setSelectedProjectId(null)
      await refreshProjects()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveProjectName() {
    if (!selectedProjectId || !editProjectName.trim()) return
    setBusy(true)
    setError(null)
    try {
      await api.updateProject(selectedProjectId, { name: editProjectName.trim() })
      await refreshProjects()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function onAddSprint(e: FormEvent) {
    e.preventDefault()
    if (!selectedProjectId || !newSprintLabel.trim()) return
    setBusy(true)
    setError(null)
    try {
      await api.createSprint(selectedProjectId, { label: newSprintLabel.trim() })
      setNewSprintLabel('')
      await refreshProjectScoped(selectedProjectId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveSprintLabel(id: number) {
    if (!selectedProjectId) return
    const label = (editSprintLabels[id] || '').trim()
    if (!label) return
    setBusy(true)
    setError(null)
    try {
      await api.updateSprint(id, { label })
      await refreshProjectScoped(selectedProjectId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteSprint(id: number) {
    if (!selectedProjectId) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteSprint(id)
      await refreshProjectScoped(selectedProjectId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function assignDeveloper() {
    if (!selectedProjectId || !assignDeveloperId) return
    setBusy(true)
    setError(null)
    try {
      await api.assignDeveloperToProject(selectedProjectId, assignDeveloperId)
      setAssignDeveloperId(null)
      await refreshProjectScoped(selectedProjectId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function onAddDeveloper(e: FormEvent) {
    e.preventDefault()
    if (!newDevName.trim()) return
    setBusy(true)
    setError(null)
    try {
      await api.createDeveloper({ name: newDevName.trim(), team: newDevTeam.trim() || undefined })
      setNewDevName('')
      setNewDevTeam('')
      await refreshGlobals()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeDeveloper(id: number) {
    if (!selectedProjectId) return
    setBusy(true)
    setError(null)
    try {
      await api.removeDeveloperFromProject(selectedProjectId, id)
      await refreshProjectScoped(selectedProjectId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin</CardTitle>
          <CardDescription>
            Manage projects, sprints, and which developers belong to each project. Entry screens will only show sprints and
            developers for the selected project.
          </CardDescription>
        </CardHeader>
        {error && <CardContent className="pt-0 text-sm text-destructive">{error}</CardContent>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Each project gets a default sprint automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onAddProject} className="flex flex-wrap gap-2">
              <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project name" />
              <Button type="submit" disabled={busy || !newProjectName.trim()}>
                Add
              </Button>
            </form>

            <div className="grid gap-2">
              <Label>Selected Project</Label>
              <Select
                value={selectedProjectId ? String(selectedProjectId) : undefined}
                onValueChange={(v) => setSelectedProjectId(Number(v) || null)}
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

            <div className="grid gap-2">
              <Label>Edit Project Name</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  placeholder="Project name"
                  disabled={!selectedProjectId}
                />
                <Button variant="outline" disabled={busy || !selectedProjectId || !editProjectName.trim()} onClick={saveProjectName}>
                  Save
                </Button>
              </div>
            </div>

            <Button variant="destructive" disabled={busy || !selectedProjectId} onClick={deleteProject}>
              Delete Project
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Setup</CardTitle>
            <CardDescription>Configure sprints and members for the selected project.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-3">
              <form onSubmit={onAddSprint} className="flex items-end gap-2 flex-wrap">
                <div className="grid gap-2">
                  <Label>New Sprint</Label>
                  <Input
                    value={newSprintLabel}
                    onChange={(e) => setNewSprintLabel(e.target.value)}
                    placeholder="Sprint label (e.g., Sprint 03)"
                    disabled={!selectedProjectId}
                  />
                </div>
                <Button type="submit" disabled={busy || !selectedProjectId || !newSprintLabel.trim()}>
                  Add Sprint
                </Button>
              </form>

              <div className="overflow-x-auto rounded-lg border bg-background/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sprint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sprints.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              value={editSprintLabels[s.id] ?? s.label}
                              onChange={(e) => setEditSprintLabels((m) => ({ ...m, [s.id]: e.target.value }))}
                              className="h-8 w-full sm:w-[220px]"
                            />
                            <Button variant="outline" size="sm" disabled={busy} onClick={() => saveSprintLabel(s.id)}>
                              Save
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.isActive ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy || sprints.length <= 1}
                            onClick={() => deleteSprint(s.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {sprints.length <= 1 && (
                <div className="text-xs text-muted-foreground">At least 1 sprint must remain (Default).</div>
              )}
            </div>

            <div className="grid gap-3">
              <div className="flex items-end gap-2 flex-wrap">
                <div className="grid gap-2">
                  <Label>Add Developer To Project</Label>
                  <Select
                    value={assignDeveloperId ? String(assignDeveloperId) : undefined}
                    onValueChange={(v) => setAssignDeveloperId(Number(v) || null)}
                    disabled={!selectedProjectId}
                  >
                    <SelectTrigger className="w-full sm:w-[320px]">
                      <SelectValue placeholder="Select developer" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableToAssign.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button disabled={busy || !selectedProjectId || !assignDeveloperId} onClick={assignDeveloper}>
                  Add
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border bg-background/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Developer</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectDevelopers.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-muted-foreground">{d.team || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" disabled={busy} onClick={() => removeDeveloper(d.id)}>
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Developers</CardTitle>
          <CardDescription>
            Developers are created once, then assigned to one or more projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onAddDeveloper} className="flex flex-wrap gap-2">
            <Input
              value={newDevName}
              onChange={(e) => setNewDevName(e.target.value)}
              placeholder="Developer name"
              className="w-full sm:w-[200px]"
            />
            <Input
              value={newDevTeam}
              onChange={(e) => setNewDevTeam(e.target.value)}
              placeholder="Team (optional)"
              className="w-full sm:w-[180px]"
            />
            <Button type="submit" disabled={busy || !newDevName.trim()}>
              Add Developer
            </Button>
          </form>
          <div className="overflow-x-auto rounded-lg border bg-background/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDevelopers.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.team || '-'}</TableCell>
                    <TableCell>{d.isActive ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
