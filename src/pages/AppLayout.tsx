import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Mark } from '../components/Brand'
import { BootScreen } from '../components/NeedProject'
import { useAuth } from '../context/Auth'
import { useWorkspace, WorkspaceProvider } from '../context/Workspace'

export default function AppLayout() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  )
}

function AppShell() {
  const { user, logout } = useAuth()
  const { project, projects, ready, error, refresh, switchProject } = useWorkspace()
  const navigate = useNavigate()

  if (!ready) return <BootScreen message="Loading your projects…" />

  if (error) {
    return (
      <div className="boot">
        <p>{error}</p>
        <button type="button" className="btn btn-small" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside>
        <NavLink to="/" className="brand brand-compact">
          <Mark size={24} />
          <span>
            Circular
            <small>Material Passports</small>
          </span>
        </NavLink>

        {projects.length > 0 && (
          <label className="switcher">
            <span>Project</span>
            <select
              value={project?.id ?? ''}
              onChange={(e) => {
                switchProject(e.target.value)
                navigate('/app/ledger')
              }}
            >
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {project && (
          <p className="project-chip">
            {project.typology || 'Typology not set'}
            <small>
              {project.areaSqft ? `${project.areaSqft.toLocaleString()} sf` : 'Area not set'}
              {project.owner ? ` · ${project.owner}` : ''}
            </small>
          </p>
        )}

        <nav className="app-nav">
          <NavLink to="/app" end>
            Desk
          </NavLink>
          <NavLink to="/app/ledger">Ledger</NavLink>
          <NavLink to="/app/capture">Capture</NavLink>
          <NavLink to="/app/passport">Passport</NavLink>
          <NavLink to="/app/portfolio">Portfolio</NavLink>
          <NavLink to="/app/library">Library</NavLink>
          <NavLink to="/app/settings">Settings</NavLink>
          <NavLink to="/app/billing">Billing</NavLink>
          {user?.role === 'admin' ? <NavLink to="/admin">Admin</NavLink> : null}
        </nav>

        <div className="aside-foot">
          <NavLink to="/app/billing" className="plan-chip">
            {user?.planName ?? 'Studio'}
            <small>
              {user?.planStatus === 'trialing'
                ? `${user.trialDaysLeft} day${user.trialDaysLeft === 1 ? '' : 's'} left in trial`
                : user?.planStatus === 'expired'
                  ? 'Trial ended'
                  : user?.limits.maxProjects != null
                    ? `${user.usage.projects}/${user.limits.maxProjects} jobs`
                    : `${user?.usage.projects ?? 0} jobs`}
            </small>
          </NavLink>
          <NavLink to={user && !user.writable ? '/app/billing' : '/app/new'} className="text-btn">
            {user && !user.writable ? 'Subscribe' : 'New project'}
          </NavLink>
          <p className="muted tiny">{user?.email}</p>
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              void logout().then(() => navigate('/'))
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main>
        {user && !user.writable ? (
          <p className="billing-banner">
            Your trial has ended. Subscribe to Studio or Firm to keep logging deliveries.{' '}
            <NavLink to="/app/billing">Open billing</NavLink>
          </p>
        ) : user?.planStatus === 'trialing' ? (
          <p className="billing-banner">
            {user.trialDaysLeft} day{user.trialDaysLeft === 1 ? '' : 's'} left in your {user.planName} trial.{' '}
            <NavLink to="/app/billing">Subscribe to keep the ledger</NavLink>
          </p>
        ) : user?.pendingPlanId && user.pendingPlanId !== 'free' ? (
          <p className="billing-banner">
            Invoice open for {user.pendingPlanId === 'firm' ? 'Firm' : 'Studio'}. Pay it to start the paid period.{' '}
            <NavLink to={`/app/billing?checkout=${user.pendingPlanId}`}>Open billing</NavLink>
          </p>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
