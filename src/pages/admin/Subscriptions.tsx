import { useState } from 'react'
import { AdminPage, AdminSwitch } from '../../components/AdminPage'
import { usePlatform } from '../../context/Platform'
import { defaultPlatform } from '../../data/platform'
import type { Plan, PlanId } from '../../data/plans'
import { savePlatformSettings } from '../../lib/api'
import { toast } from '../../lib/toast'

export default function AdminSubscriptions() {
  const { settings, refresh } = usePlatform()
  const [trialDays, setTrialDays] = useState(settings.trialDays)
  const [plans, setPlans] = useState<Plan[]>(() => settings.plans.map((plan) => ({ ...plan, features: [...plan.features] })))
  const [recommendations, setRecommendations] = useState(() => settings.recommendations.map((item) => ({ ...item })))
  const [busy, setBusy] = useState(false)

  function patchPlan(id: PlanId, patch: Partial<Plan>) {
    setPlans((current) =>
      current.map((plan) => {
        if (plan.id !== id) return patch.recommended ? { ...plan, recommended: false } : plan
        return { ...plan, ...patch }
      }),
    )
  }

  async function save() {
    setBusy(true)
    try {
      await savePlatformSettings({ ...settings, trialDays, plans, recommendations })
      await refresh()
      toast('Subscriptions saved')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save subscriptions')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminPage
      kicker="Site"
      title="Subscriptions"
      lede="Trial length, price, limits, and landing copy. Empty project or invoice limits mean unlimited. Free is not sold."
      actions={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const fresh = defaultPlatform()
              setTrialDays(fresh.trialDays)
              setPlans(fresh.plans)
              setRecommendations(fresh.recommendations)
            }}
          >
            Reset
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save subscriptions'}
          </button>
        </>
      }
    >
      <section className="admin-card">
        <header className="admin-card-head">
          <div>
            <p className="admin-kind">Trial</p>
            <h2>Free trial period</h2>
          </div>
        </header>
        <div className="admin-fields">
          <label>
            Days
            <input
              type="number"
              min={1}
              max={90}
              value={trialDays}
              onChange={(e) => setTrialDays(Math.min(90, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
        </div>
        <p className="muted tiny">New Studio and Firm accounts start with every feature on that plan for this many days. After that the ledger is read-only until they subscribe.</p>
      </section>

      {plans.map((plan) => (
        <section key={plan.id} className="admin-card">
          <header className="admin-card-head">
            <div>
              <p className="admin-kind">{plan.id}</p>
              <h2>{plan.name}</h2>
            </div>
            <div className="admin-card-meta">
              {plan.id === 'free' ? (
                <span className="muted tiny">Not sold</span>
              ) : (
                <AdminSwitch checked={plan.enabled !== false} onChange={(value) => patchPlan(plan.id, { enabled: value })}>
                  Visible
                </AdminSwitch>
              )}
              <AdminSwitch checked={plan.canExport} onChange={(value) => patchPlan(plan.id, { canExport: value })}>
                Export
              </AdminSwitch>
              <AdminSwitch checked={Boolean(plan.canShare)} onChange={(value) => patchPlan(plan.id, { canShare: value })}>
                Share
              </AdminSwitch>
              <AdminSwitch
                checked={Boolean(plan.canPortfolio)}
                onChange={(value) => patchPlan(plan.id, { canPortfolio: value })}
              >
                Portfolio
              </AdminSwitch>
              <AdminSwitch
                checked={Boolean(plan.recommended)}
                onChange={(value) => patchPlan(plan.id, { recommended: value })}
              >
                Recommended
              </AdminSwitch>
            </div>
          </header>
          <div className="admin-fields">
            <label>
              Name
              <input value={plan.name} onChange={(e) => patchPlan(plan.id, { name: e.target.value })} />
            </label>
            <label>
              Price (USD)
              <input
                type="number"
                min={0}
                value={plan.price}
                onChange={(e) => patchPlan(plan.id, { price: Number(e.target.value) || 0 })}
              />
            </label>
            <label>
              Cadence
              <input value={plan.cadence} onChange={(e) => patchPlan(plan.id, { cadence: e.target.value })} />
            </label>
            <label>
              Max projects
              <input
                type="number"
                min={0}
                placeholder="Unlimited"
                value={plan.maxProjects ?? ''}
                onChange={(e) =>
                  patchPlan(plan.id, { maxProjects: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </label>
            <label>
              Max invoices
              <input
                type="number"
                min={0}
                placeholder="Unlimited"
                value={plan.maxReceipts ?? ''}
                onChange={(e) =>
                  patchPlan(plan.id, { maxReceipts: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </label>
            <label className="full">
              Short blurb
              <input value={plan.blurb} onChange={(e) => patchPlan(plan.id, { blurb: e.target.value })} />
            </label>
            <label className="full">
              Audience
              <input value={plan.audience} onChange={(e) => patchPlan(plan.id, { audience: e.target.value })} />
            </label>
            <label className="full">
              Best for
              <input value={plan.bestFor} onChange={(e) => patchPlan(plan.id, { bestFor: e.target.value })} />
            </label>
            <label className="full">
              Note
              <input value={plan.note} onChange={(e) => patchPlan(plan.id, { note: e.target.value })} />
            </label>
            <label className="full">
              Features (one per line)
              <textarea
                rows={6}
                value={plan.features.join('\n')}
                onChange={(e) => patchPlan(plan.id, { features: e.target.value.split('\n') })}
              />
            </label>
          </div>
        </section>
      ))}

      <p className="admin-section-label">Landing recommendations</p>
      {recommendations.map((item, index) => (
        <section key={item.planId} className="admin-card">
          <header className="admin-card-head">
            <div>
              <p className="admin-kind">{item.planId}</p>
              <h2>{item.title || 'Recommendation'}</h2>
            </div>
          </header>
          <div className="admin-fields">
            <label>
              Kicker
              <input
                value={item.kicker}
                onChange={(e) =>
                  setRecommendations((current) =>
                    current.map((row, i) => (i === index ? { ...row, kicker: e.target.value } : row)),
                  )
                }
              />
            </label>
            <label>
              Who
              <input
                value={item.who}
                onChange={(e) =>
                  setRecommendations((current) =>
                    current.map((row, i) => (i === index ? { ...row, who: e.target.value } : row)),
                  )
                }
              />
            </label>
            <label className="full">
              Title
              <input
                value={item.title}
                onChange={(e) =>
                  setRecommendations((current) =>
                    current.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)),
                  )
                }
              />
            </label>
            <label className="full">
              Quote
              <textarea
                rows={3}
                value={item.quote}
                onChange={(e) =>
                  setRecommendations((current) =>
                    current.map((row, i) => (i === index ? { ...row, quote: e.target.value } : row)),
                  )
                }
              />
            </label>
          </div>
        </section>
      ))}

    </AdminPage>
  )
}
