import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useWorkspace } from '../context/Workspace'
import { ApiError } from '../lib/api'
import { toast } from '../lib/toast'
import { TYPOLOGIES } from '../types'

export default function NewProject() {
  const { user } = useAuth()
  const { createProject } = useWorkspace()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [typology, setTypology] = useState<string>('Mixed-use')
  const [areaSqft, setAreaSqft] = useState('')
  const [owner, setOwner] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const atLimit =
    user != null &&
    (!user.writable || (user.limits.maxProjects != null && user.usage.projects >= user.limits.maxProjects))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || atLimit) return
    setBusy(true)
    setError('')
    try {
      await createProject({
        name: name.trim(),
        address: address.trim(),
        typology,
        areaSqft: Number(areaSqft) || 0,
        owner: owner.trim(),
        year: Number(year) || new Date().getFullYear(),
      })
      toast(`${name.trim()} is ready`)
      navigate('/app/capture')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not create the project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel">
      <header className="panel-head">
        <div>
          <p className="eyebrow">New project</p>
          <h1>Open a building file.</h1>
          <p className="muted">
            This is the folder every receipt posts into. You can change these details later.
          </p>
        </div>
      </header>

      <form className="form-grid" onSubmit={(e) => void submit(e)}>
        {atLimit && user ? (
          <p className="banner warn full">
            {!user.writable
              ? 'Your trial has ended. Subscribe to open another building file.'
              : `${user.planName} includes ${user.limits.maxProjects} project${user.limits.maxProjects === 1 ? '' : 's'}.`}{' '}
            <Link to="/app/billing">View plans</Link>.
          </p>
        ) : null}
        {error && (
          <p className="banner warn full">
            {error} <Link to="/app/billing">View plans</Link>
          </p>
        )}
        <label className="full">
          Project name
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Riverside Annex" />
        </label>
        <label className="full">
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="418 SE Water Ave, Portland, OR" />
        </label>
        <label>
          Typology
          <select value={typology} onChange={(e) => setTypology(e.target.value)}>
            {TYPOLOGIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Area (sf)
          <input
            type="number"
            min={0}
            value={areaSqft}
            onChange={(e) => setAreaSqft(e.target.value)}
            placeholder="14200"
          />
        </label>
        <label>
          Owner
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Northline Properties" />
        </label>
        <label>
          Year
          <input type="number" min={1900} max={2100} value={year} onChange={(e) => setYear(e.target.value)} />
        </label>
        <div className="form-actions full">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/app')}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={!name.trim() || busy || atLimit}>
            {busy ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  )
}
