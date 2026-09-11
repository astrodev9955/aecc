import { usePlatform } from '../context/Platform'
import { visiblePartners } from '../data/platform'

export function PartnerSlider() {
  const { settings } = usePlatform()
  const partners = visiblePartners(settings)
  if (partners.length === 0) return null
  const loop = [...partners, ...partners]
  return (
    <section id="partners" className="partners" aria-label="Project partners">
      <header className="partners-head">
        <p className="eyebrow">{settings.partners.eyebrow}</p>
        <h2>{settings.partners.title}</h2>
      </header>
      <div className="partner-viewport">
        <div className="partner-track">
          {loop.map((partner, index) => (
            <img
              key={`${partner.id}-${index}`}
              className="partner-logo"
              src={partner.src}
              alt={partner.name}
              height={72}
              width={280}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
