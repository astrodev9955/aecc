import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { NeedProject } from '../components/NeedProject'
import { useWorkspace } from '../context/Workspace'
import { toast } from '../lib/toast'
import { TYPOLOGIES } from '../types'

export default function Settings() {
  const { project } = useWorkspace()
  if (!project) return <NeedProject />
  return <SettingsForm key={project.id} />
}

function SettingsForm() {
  const { project, updateProject, deleteProject } = useWorkspace()
  const navigate = useNavigate()
  const [name, setName] = useState(project?.name ?? '')
  const [address, setAddress] = useState(project?.address ?? '')
  const [typology, setTypology] = useState(project?.typology ?? 'Mixed-use')
  const [areaSqft, setAreaSqft] = useState(String(project?.areaSqft || ''))
  const [owner, setOwner] = useState(project?.owner ?? '')
  const [year, setYear] = useState(String(project?.year ?? new Date().getFullYear()))
  const [notes, setNotes] = useState(project?.notes ?? '')
  const [busy, setBusy] = useState(false)

  if (!project) return <NeedProject />

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!project) return
    setBusy(true)
    try {
      await updateProject({
        name: name.trim() || project.name,
        address: address.trim(),
        typology,
        areaSqft: Number(areaSqft) || 0,
        owner: owner.trim(),
        year: Number(year) || project.year,
        notes: notes.trim(),
      })
      toast('Project details saved')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">Project</p>
          <h1>Settings</h1>
          <p className="muted">These fields print on the birth certificate and sit in the sidebar.</p>
        </div>
      </header>

      <form className="form-grid" onSubmit={save}>
        <label className="full">
          Project name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="full">
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label>
          Typology
          <select value={typology} onChange={(e) => setTypology(e.target.value)}>
            {!TYPOLOGIES.includes(typology as (typeof TYPOLOGIES)[number]) && (
              <option value={typology}>{typology}</option>
            )}
            {TYPOLOGIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Area (sf)
          <input type="number" min={0} value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} />
        </label>
        <label>
          Owner
          <input value={owner} onChange={(e) => setOwner(e.target.value)} />
        </label>
        <label>
          Year
          <input type="number" min={1900} max={2100} value={year} onChange={(e) => setYear(e.target.value)} />
        </label>
        <label className="full">
          Notes
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="form-actions full">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving…' : 'Save project'}
          </button>
        </div>
      </form>

      <section className="danger-zone">
        <h2 className="subhead">Danger zone</h2>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            if (!project) return
            if (!window.confirm(`Delete ${project.name} and all of its invoices? This cannot be undone.`)) return
            void deleteProject(project.id)
              .then(() => {
                toast('Project deleted')
                navigate('/app')
              })
              .catch((err: unknown) => toast(err instanceof Error ? err.message : 'Could not delete project'))
          }}
        >
          Delete this project
        </button>
      </section>
    </div>
  )
}
