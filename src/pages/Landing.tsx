import { Link } from 'react-router-dom'
import { Mark, ReceiptSheet } from '../components/Brand'
import { HeroSlider } from '../components/HeroSlider'
import { PartnerSlider } from '../components/PartnerSlider'
import { PaymentMarks } from '../components/PaymentMarks'
import { useAuth } from '../context/Auth'
import { usePlatform } from '../context/Platform'
import { visiblePlans } from '../data/platform'
import { formatPlanPrice } from '../data/plans'
import { SAMPLE_RECEIPTS } from '../data/samples'

export default function Landing() {
  const { user, ready } = useAuth()
  const { settings } = usePlatform()
  const plans = visiblePlans(settings)
  const signedIn = Boolean(ready && user)

  return (
    <div className="site">
      <header className="site-nav">
        <Link to="/" className="brand">
          <Mark />
          <span>
            Circular
            <small>Material Passports</small>
          </span>
        </Link>
        <nav>
          <a href="#how">Method</a>
          <a href="#stay">Why it sticks</a>
          <a href="#partners">Partners</a>
          <a href="#plans">Plans</a>
          {signedIn ? (
            <>
              {user?.role === 'admin' ? (
                <Link to="/admin" className="btn btn-ghost btn-small">
                  Admin
                </Link>
              ) : null}
              <Link to="/app" className="btn btn-small">
                Open workspace
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-small">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-small">
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>

      <HeroSlider signedIn={signedIn} />

      <section className="stat-band" aria-label="The leak">
        <div className="stat-card">
          <p className="stat-num">8%</p>
          <p className="stat-cap">
            Typical material value lost to over-order, damage, and offcuts before the project is
            finished.
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-num">10 yr</p>
          <p className="stat-cap">
            The window before a sale or refinance when a buyer will ask for embodied carbon — and
            you will wish someone had kept the receipts.
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-num">1 photo</p>
          <p className="stat-cap">
            The capture step. No BIM plugin. No consultant on site. The invoice already lists what
            arrived.
          </p>
        </div>
      </section>

      <section id="how" className="how">
        <header className="section-head">
          <p className="eyebrow">Method</p>
          <h2>From dock to passport in three moves.</h2>
        </header>
        <ol className="steps">
          <li>
            <span>01</span>
            <h3>Photograph the receipt</h3>
            <p>
              When the delivery lands, take a picture of the supplier invoice. Paper, PDF, or a
              photo from the site WhatsApp thread — all of it counts.
            </p>
          </li>
          <li>
            <span>02</span>
            <h3>Confirm the takeoff</h3>
            <p>
              Circular reads the lines, matches them to a material library, and assigns mass,
              carbon factors, and salvage rates. A superintendent can correct a line in seconds.
            </p>
          </li>
          <li>
            <span>03</span>
            <h3>Issue the birth certificate</h3>
            <p>
              The building accumulates a passport: inventory, embodied carbon, and recoverable
              value. At sale, you hand over a document — not a core-drill invoice.
            </p>
          </li>
        </ol>

        <div className="receipt-row">
          {SAMPLE_RECEIPTS.map((sample) => (
            <ReceiptSheet key={sample.id} sample={sample} />
          ))}
        </div>
        <p className="fineprint">
          Example delivery tickets. After you sign in, use them as templates or enter a live
          invoice from the dock.
        </p>
      </section>

      <section id="why" className="why">
        <blockquote>
          <p>
            In ten years, when you sell or refinance, the new buyer will demand to know the
            building’s embodied carbon. Without a passport you pay consultants to guess what is
            inside the walls. With one, you hand them a digital birth certificate — and a
            liability becomes a marketable asset.
          </p>
        </blockquote>
        <div className="why-grid">
          <article>
            <h3>Owners &amp; developers</h3>
            <p>
              Embodied carbon is moving from a specialist report to a diligence item. A passport
              built during construction is cheaper than a forensic survey at disposal.
            </p>
          </article>
          <article>
            <h3>Contractors</h3>
            <p>
              Over-order is not only waste — it is untracked inventory. Logging receipts gives a
              live picture of what actually arrived versus what was specified.
            </p>
          </article>
          <article>
            <h3>Lenders &amp; buyers</h3>
            <p>
              Salvage value is a real option on copper, steel, and aluminum. Carbon is the other
              column. Both belong on the asset file.
            </p>
          </article>
        </div>
      </section>

      <section id="stay" className="why stay">
        <header className="section-head">
          <p className="eyebrow">Why not build your own</p>
          <h2>Anyone can clone a form. Nobody clones the file.</h2>
          <p className="muted">
            A studio can stand up a receipt spreadsheet in a week. They cannot stand up five years
            of matched tickets, a living revision on each building, and a link a buyer already has.
            Circular is the working file — you open it because the next delivery has nowhere else
            to go.
          </p>
        </header>
        <div className="why-grid">
          <article>
            <h3>The ledger compounds</h3>
            <p>
              Revision 1 is a trial. Revision 40 is the as-purchased record. Leaving means
              re-entering every dock ticket, or handing a buyer a gap.
            </p>
          </article>
          <article>
            <h3>The desk calls you back</h3>
            <p>
              Quiet jobs, missing addresses, and last week’s suppliers sit on the trailer desk.
              You do not remember to log — the file asks.
            </p>
          </article>
          <article>
            <h3>The passport stays live</h3>
            <p>
              A shared link is not a PDF from March. It is this morning’s revision. That is the
              habit: photograph, post, the buyer already has the new number.
            </p>
          </article>
        </div>
      </section>

      <PartnerSlider />

      <section id="plans" className="plans">
        <header className="section-head">
          <p className="eyebrow">Service plans</p>
          <h2>Fourteen days on the full ledger. Then pick a paid plan.</h2>
          <p className="muted">
            Studio and Firm both open with a {settings.trialDays}-day trial of every feature on that
            plan. After the trial, subscribe to keep logging tickets. The shareable link and file
            export are on both plans. The office rollup is Firm.
          </p>
        </header>
        <div className="plan-grid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`plan-card ${plan.recommended ? 'is-recommended' : ''}`}
            >
              {plan.recommended ? <p className="plan-ribbon">Recommended</p> : <p className="plan-ribbon ghost">Service plan</p>}
              <p className="plan-price">
                <strong>${plan.price}</strong>
                <span>/{plan.cadence}</span>
              </p>
              <h2>{plan.name}</h2>
              <p className="muted">{plan.blurb}</p>
              <p className="plan-audience">{plan.audience}</p>
              <p className="plan-best">
                Best for <strong>{plan.bestFor}</strong>
              </p>
              <ul>
                {plan.features.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="plan-note">{plan.note}</p>
              <Link
                to={signedIn ? '/app/billing' : `/register?plan=${plan.id}`}
                className={plan.recommended ? 'btn' : 'btn btn-ghost'}
              >
                {signedIn ? `Open ${plan.name}` : `Start ${settings.trialDays}-day ${plan.name} trial`}
              </Link>
              <p className="tiny muted">{settings.trialDays}-day trial, then {formatPlanPrice(plan)}</p>
            </article>
          ))}
        </div>

        <section id="recommend" className="recommend" aria-labelledby="recommend-title">
          <header className="section-head">
            <p className="eyebrow">Recommendation</p>
            <h2 id="recommend-title">Which ledger fits the load.</h2>
          </header>
          <div className="recommend-grid">
            {settings.recommendations.map((item) => {
              const plan = settings.plans.find((entry) => entry.id === item.planId)
              return (
                <article key={item.planId} className={plan?.recommended ? 'is-recommended' : ''}>
                  <p className="eyebrow">{item.kicker}</p>
                  <h3>{item.title}</h3>
                  <p>{item.quote}</p>
                  <p className="recommend-who">{item.who}</p>
                  <Link to={signedIn ? '/app/billing' : `/register?plan=${item.planId}`} className="text-btn">
                    {plan ? `Choose ${plan.name}` : 'View plan'}
                  </Link>
                </article>
              )
            })}
          </div>
        </section>
      </section>

      <section className="listing">
        <p className="eyebrow">Live ledger</p>
        <h2>Create an account. Open a job. Keep every delivery.</h2>
        <p>
          Each project is stored on the server with its invoices, masses, and salvage record. Sign
          in from the trailer or the office — the passport is the same file.
        </p>
        <div className="hero-actions">
          <Link to={signedIn ? '/app' : '/register'} className="btn">
            {signedIn ? 'Open workspace' : `Start a ${settings.trialDays}-day trial`}
          </Link>
          {!signedIn && (
            <Link to="/login" className="btn btn-ghost">
              Sign in
            </Link>
          )}
        </div>
      </section>

      <footer className="site-foot">
        <div className="foot-brand">
          <Mark size={22} />
          <p>
            Circular · Material Passports · Indicative ICE / industry carbon factors, not a certified
            LCA
          </p>
        </div>
        <PaymentMarks />
      </footer>
    </div>
  )
}
