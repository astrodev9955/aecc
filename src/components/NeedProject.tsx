import { Link } from 'react-router-dom'
import { useAuth } from '../context/Auth'

export function NeedProject() {
  const { user } = useAuth()
  const locked = user && !user.writable
  return (
    <div className="panel">
      <div className="empty">
        <h3>{locked ? 'Subscribe to open a job' : 'Open a building file'}</h3>
        <p className="muted">
          {locked
            ? 'Your trial has ended. Existing files stay here. Subscribe to Studio or Firm to log new deliveries.'
            : 'Create a project to log deliveries and issue a material passport.'}
        </p>
        <Link to={locked ? '/app/billing' : '/app/new'} className="btn btn-small">
          {locked ? 'View plans' : 'New project'}
        </Link>
      </div>
    </div>
  )
}

export function BootScreen({ message = 'Loading Circular…' }: { message?: string }) {
  return (
    <div className="boot" role="status">
      <p>{message}</p>
    </div>
  )
}
