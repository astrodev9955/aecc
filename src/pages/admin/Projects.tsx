import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPage } from '../../components/AdminPage'
import { adminListProjects, type AdminProjectRow } from '../../lib/api'

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<AdminProjectRow[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => {
      adminListProjects(q)
        .then((data) => {
          setProjects(data.projects)
          setError('')
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load projects'))
    }, 200)
    return () => window.clearTimeout(handle)
  }, [q])

  return (
    <AdminPage kicker="Records" title="Projects" lede="Every building file on the server.">
      {error ? <p className="banner warn">{error}</p> : null}

      <div className="toolbar admin-toolbar">
        <input
          className="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search job, address, owner"
          aria-label="Search projects"
        />
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Project</th>
              <th>Account</th>
              <th>Typology</th>
              <th>Invoices</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>
                  {project.name}
                  <div className="muted tiny">{project.address || 'No address'}</div>
                </td>
                <td>
                  <Link to={`/admin/users/${project.userId}`}>{project.userName}</Link>
                  <div className="muted tiny">{project.userEmail}</div>
                </td>
                <td>{project.typology || '—'}</td>
                <td>{project.receiptCount}</td>
                <td>{when(project.updatedAt)}</td>
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No projects match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminPage>
  )
}
