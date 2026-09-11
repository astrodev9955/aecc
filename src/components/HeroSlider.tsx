import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { usePlatform } from '../context/Platform'
import { HERO_SLIDES as FALLBACK_SLIDES } from '../data/content'
import { visibleHeroSlides } from '../data/platform'
import { HeroDrawing } from './HeroDrawings'

export function HeroSlider({ signedIn }: { signedIn: boolean }) {
  const { settings } = usePlatform()
  const slides = visibleHeroSlides(settings)
  const list = slides.length > 0 ? slides : FALLBACK_SLIDES
  const interval = settings.hero.intervalMs || 4000
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const slide = list[index] ?? list[0]!

  useEffect(() => {
    setIndex((current) => (current < list.length ? current : 0))
  }, [list.length])

  useEffect(() => {
    if (paused || list.length < 2) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % list.length)
    }, interval)
    return () => window.clearInterval(id)
  }, [paused, index, interval, list.length])

  function go(next: number) {
    setIndex((next + list.length) % list.length)
  }

  function onMove(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    })
  }

  return (
    <section
      className="hero-slider"
      aria-roledescription="carousel"
      aria-label="Circular product story"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false)
        setTilt({ x: 0, y: 0 })
      }}
      onMouseMove={onMove}
    >
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-slider-inner">
        <div className="hero-copy">
          <div key={slide.id} className="hero-copy-swap">
            <p className="eyebrow">{slide.kicker}</p>
            <h1 aria-live="polite">
              {slide.title} <em>{slide.emphasis}</em>
            </h1>
            <p className="lede">{slide.lede}</p>
          </div>
          <div className="hero-actions">
            <Link to={signedIn ? '/app/new' : '/register'} className="btn">
              {signedIn ? 'Start a project' : `Start a ${settings.trialDays}-day trial`}
            </Link>
            <Link to={signedIn ? '/app' : '/login'} className="btn btn-ghost">
              {signedIn ? 'Open ledger' : 'Sign in to your ledger'}
            </Link>
          </div>
          <div className="hero-controls">
            <button type="button" className="hero-arrow" aria-label="Previous slide" onClick={() => go(index - 1)}>
              ←
            </button>
            <div className="hero-dots" role="tablist" aria-label="Slides">
              {list.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}: ${item.kicker}`}
                  className={i === index ? 'is-active' : ''}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
            <button type="button" className="hero-arrow" aria-label="Next slide" onClick={() => go(index + 1)}>
              →
            </button>
          </div>
        </div>

        <div
          className="hero-visual"
          aria-hidden="true"
          style={
            {
              '--tilt-x': String(tilt.x),
              '--tilt-y': String(tilt.y),
            } as CSSProperties
          }
        >
          <div className="hero-plate">
            {list.map((item) => (
              <div key={item.id} className={`hero-photo ${item.id === slide.id ? 'is-active' : ''}`}>
                <div className="hero-photo-shift">
                  <img src={item.image} alt="" />
                </div>
              </div>
            ))}
            <HeroDrawing key={slide.id} kind={slide.visual} />
            <div key={`${slide.id}-scan`} className="hero-scan" />
            <div className="hero-pins">
              {slide.pins.map((pin) => (
                <div key={`${slide.id}-${pin.kicker}`} className="hero-pin" style={{ top: pin.top, left: pin.left }}>
                  <i />
                  <span>
                    <small>{pin.kicker}</small>
                    <strong>{pin.value}</strong>
                  </span>
                </div>
              ))}
            </div>
            <div className="hero-titleblock">
              <div>
                <small>Project</small>
                <strong>Riverside Annex</strong>
              </div>
              <div>
                <small>Sheet</small>
                <strong>
                  {slide.sheet} · {slide.sheetName}
                </strong>
              </div>
              <div>
                <small>Scale</small>
                <strong>{slide.scale}</strong>
              </div>
              <div>
                <small>{slide.metricLabel}</small>
                <strong>{slide.metric}</strong>
              </div>
            </div>
          </div>
          <div className="hero-progress">
            <span key={slide.id} className={paused ? 'is-paused' : ''} />
          </div>
        </div>
      </div>
    </section>
  )
}
