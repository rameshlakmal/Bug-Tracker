import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '@/api'
import type { Developer } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function DeveloperEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit) return
    const stateDev = (location.state as { developer?: Developer } | null)?.developer
    if (stateDev) {
      setName(stateDev.name)
      setTeam(stateDev.team ?? '')
      setIsActive(stateDev.isActive)
      return
    }
    // Fallback: load from list
    api.listDevelopers().then((list) => {
      const found = list.find((d) => d.id === Number(id))
      if (found) {
        setName(found.name)
        setTeam(found.team ?? '')
        setIsActive(found.isActive)
      }
    }).catch((e: any) => setError(e.message))
  }, [id, isEdit, location.state])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      if (isEdit) {
        await api.updateDeveloper(Number(id), {
          name: name.trim(),
          team: team.trim() || undefined,
          isActive,
        })
      } else {
        await api.createDeveloper({
          name: name.trim(),
          team: team.trim() || undefined,
        })
      }
      navigate('/admin/developers')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Developer' : 'New Developer'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update developer details.' : 'Create a new developer to assign to projects.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice Smith"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="team">Team <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Backend"
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
            <Button type="submit" disabled={busy || !name.trim()}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/developers')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
