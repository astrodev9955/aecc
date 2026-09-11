import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthSplit } from '../components/AuthSplit'
import { PhoneField } from '../components/PhoneField'
import { useAuth } from '../context/Auth'
import { isValidNationalNumber } from '../data/countries'
import { usePlatform } from '../context/Platform'
import { visiblePlans } from '../data/platform'
import { formatPlanPrice, isPlanId, type PlanId } from '../data/plans'
import { ApiError } from '../lib/api'

export default function Register() {
  const { user, ready, register } = useAuth()
  const { settings } = usePlatform()
  const plans = visiblePlans(settings)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const requested = params.get('plan') ?? 'studio'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('US')
  const [phoneNational, setPhoneNational] = useState('')
  const [planId, setPlanId] = useState<PlanId>(isPlanId(requested) && requested !== 'free' ? requested : 'studio')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (ready && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.planStatus === 'expired' || user.planStatus === 'pending_payment') {
      return <Navigate to="/app/billing" replace />
    }
    return <Navigate to="/app/new" replace />
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!isValidNationalNumber(phoneCountry, phoneNational)) {
      setError('Enter a valid phone number for the selected country')
      return
    }
    setBusy(true)
    setError('')
    try {
      await register({ name, email, password, planId, phoneCountry, phoneNational })
      navigate('/app/new')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the account')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthSplit kicker="New workspace">
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <h1>Create an account</h1>
        <p className="muted">
          Studio and Firm both start with a {settings.trialDays}-day trial of the full plan. Subscribe before it ends to
          keep logging deliveries.
        </p>
        {error && <p className="banner warn">{error}</p>}
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="field-hint">At least 8 characters.</span>
        </label>
        <div>
          <span className="field-caption">Phone</span>
          <PhoneField
            countryIso={phoneCountry}
            national={phoneNational}
            onCountry={setPhoneCountry}
            onNational={setPhoneNational}
          />
          <span className="field-hint">Include a reachable mobile or office line.</span>
        </div>
        <fieldset className="plan-picker">
          <legend>Plan</legend>
          {plans.map((plan) => (
            <label key={plan.id} className={planId === plan.id ? 'is-active' : ''}>
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={planId === plan.id}
                onChange={() => setPlanId(plan.id)}
              />
              <span>
                <strong>{plan.name}</strong>
                <small>{formatPlanPrice(plan)}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Creating account…' : `Start ${settings.trialDays}-day trial`}
        </button>
        <p className="muted tiny">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthSplit>
  )
}
