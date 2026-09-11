import { useEffect, useState } from 'react'
import { AdminPage, AdminSwitch } from '../../components/AdminPage'
import { MethodGlyph } from '../../components/PaymentMarks'
import { usePlatform } from '../../context/Platform'
import { defaultPlatform } from '../../data/platform'
import {
  integrationFields,
  integrationReady,
  type PaymentMethod,
  type PaymentMethodId,
} from '../../data/payments'
import { adminGetPlatform, savePlatformSettings } from '../../lib/api'
import { toast } from '../../lib/toast'

function prettyOption(value: string) {
  if (value === 'paymongo') return 'PayMongo'
  if (value === 'xendit') return 'Xendit'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function AdminPayments() {
  const { settings, refresh } = usePlatform()
  const [payments, setPayments] = useState<PaymentMethod[]>(() => clonePayments(settings.payments))
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    adminGetPlatform()
      .then((data) => setPayments(clonePayments(data.platform.payments)))
      .catch(() => setPayments(clonePayments(settings.payments)))
      .finally(() => setLoaded(true))
  }, [])

  function patch(id: string, next: Partial<PaymentMethod>) {
    setPayments((current) => current.map((item) => (item.id === id ? { ...item, ...next } : item)))
  }

  function patchKey(id: PaymentMethodId, key: string, value: string) {
    setPayments((current) =>
      current.map((item) =>
        item.id === id ? { ...item, integration: { ...item.integration, [key]: value } } : item,
      ),
    )
  }

  async function save() {
    setBusy(true)
    try {
      const data = await savePlatformSettings({ ...settings, payments })
      setPayments(clonePayments(data.platform.payments))
      await refresh()
      toast('Payment options saved')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save payment options')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminPage
      kicker="Site"
      title="Payments"
      lede="Turn methods on, then paste processor keys. Secrets stay on the server."
      actions={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setPayments(clonePayments(defaultPlatform().payments))}
          >
            Reset
          </button>
          <button type="button" className="btn" disabled={busy || !loaded} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save payments'}
          </button>
        </>
      }
    >
      {payments.map((method) => {
        const fields = integrationFields(method.id)
        const ready = integrationReady(method)
        return (
          <section key={method.id} className="admin-card">
            <header className="admin-card-head">
              <div className="admin-card-ident">
                <span className="admin-pay-glyph">
                  <MethodGlyph methodId={method.id} />
                </span>
                <div>
                  <p className="admin-kind">{method.kind}</p>
                  <h2>{method.name}</h2>
                </div>
              </div>
              <div className="admin-card-meta">
                <span className={`admin-pill${ready ? ' is-ready' : ''}`}>{ready ? 'Keys complete' : 'Keys needed'}</span>
                <AdminSwitch
                  checked={method.enabled !== false}
                  onChange={(value) => patch(method.id, { enabled: value })}
                >
                  Checkout
                </AdminSwitch>
                <AdminSwitch
                  checked={method.showMark !== false}
                  onChange={(value) => patch(method.id, { showMark: value })}
                >
                  Footer
                </AdminSwitch>
              </div>
            </header>

            <div className="admin-fields">
              <label>
                Display name
                <input value={method.name} onChange={(e) => patch(method.id, { name: e.target.value })} />
              </label>
              <label className="full">
                Checkout blurb
                <input value={method.blurb} onChange={(e) => patch(method.id, { blurb: e.target.value })} />
              </label>
            </div>

            <div className="admin-well">
              <div className="admin-well-head">
                <h3>Integration</h3>
                <p>Required fields are marked. Secret values are hidden from the public API.</p>
              </div>
              <div className="admin-fields">
                {fields.map((field) => (
                  <label key={field.key} className={field.secret ? 'full' : undefined}>
                    <span className="admin-label-row">
                      {field.label}
                      {field.required ? <em>Required</em> : null}
                    </span>
                    {field.options ? (
                      <select
                        value={method.integration?.[field.key] ?? ''}
                        onChange={(e) => patchKey(method.id, field.key, e.target.value)}
                      >
                        <option value="">Choose a value</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {prettyOption(option)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.secret ? 'password' : 'text'}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={field.placeholder}
                        value={method.integration?.[field.key] ?? ''}
                        onChange={(e) => patchKey(method.id, field.key, e.target.value)}
                      />
                    )}
                    <span className="field-hint">{field.hint}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </AdminPage>
  )
}

function clonePayments(list: PaymentMethod[]): PaymentMethod[] {
  return list.map((item) => ({ ...item, integration: { ...(item.integration ?? {}) } }))
}
