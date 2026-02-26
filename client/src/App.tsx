import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { EntryPage } from './pages/EntryPage'
import { ReportPage } from './pages/ReportPage'
import { TrendsPage } from './pages/TrendsPage'
import { ProjectsPage } from './pages/admin/ProjectsPage'
import { ProjectEditPage } from './pages/admin/ProjectEditPage'
import { SprintsPage } from './pages/admin/SprintsPage'
import { SprintEditPage } from './pages/admin/SprintEditPage'
import { DevelopersPage } from './pages/admin/DevelopersPage'
import { DeveloperEditPage } from './pages/admin/DeveloperEditPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/entry" element={<EntryPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/trends" element={<TrendsPage />} />

        <Route path="/admin" element={<Navigate to="/admin/projects" replace />} />
        <Route path="/admin/projects" element={<ProjectsPage />} />
        <Route path="/admin/projects/new" element={<ProjectEditPage />} />
        <Route path="/admin/projects/:id/edit" element={<ProjectEditPage />} />
        <Route path="/admin/sprints" element={<SprintsPage />} />
        <Route path="/admin/sprints/new" element={<SprintEditPage />} />
        <Route path="/admin/sprints/:id/edit" element={<SprintEditPage />} />
        <Route path="/admin/developers" element={<DevelopersPage />} />
        <Route path="/admin/developers/new" element={<DeveloperEditPage />} />
        <Route path="/admin/developers/:id/edit" element={<DeveloperEditPage />} />
      </Route>
    </Routes>
  )
}
