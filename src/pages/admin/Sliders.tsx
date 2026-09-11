import { useState } from 'react'
import { AdminPage, AdminSwitch } from '../../components/AdminPage'
import { usePlatform } from '../../context/Platform'
import type { HeroSlide, HeroVisual, PartnerItem } from '../../data/content'
import { defaultPlatform } from '../../data/platform'
import { savePlatformSettings, uploadPlatformImage } from '../../lib/api'
import { toast } from '../../lib/toast'

const VISUALS: HeroVisual[] = ['receipt', 'carbon', 'salvage', 'passport']

export default function AdminSliders() {
  const { settings, refresh } = usePlatform()
  const [intervalMs, setIntervalMs] = useState(settings.hero.intervalMs)
  const [slides, setSlides] = useState<HeroSlide[]>(() =>
    settings.hero.slides.map((slide) => ({ ...slide, pins: slide.pins.map((pin) => ({ ...pin })) })),
  )
  const [eyebrow, setEyebrow] = useState(settings.partners.eyebrow)
  const [title, setTitle] = useState(settings.partners.title)
  const [partners, setPartners] = useState<PartnerItem[]>(() => settings.partners.items.map((item) => ({ ...item })))
  const [busy, setBusy] = useState(false)

  function patchSlide(id: string, patch: Partial<HeroSlide>) {
    setSlides((current) => current.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)))
  }

  function patchPin(slideId: string, index: number, patch: Partial<HeroSlide['pins'][number]>) {
    setSlides((current) =>
      current.map((slide) =>
        slide.id === slideId
          ? { ...slide, pins: slide.pins.map((pin, i) => (i === index ? { ...pin, ...patch } : pin)) }
          : slide,
      ),
    )
  }

  function moveSlide(index: number, dir: -1 | 1) {
    setSlides((current) => {
      const next = [...current]
      const swap = index + dir
      if (swap < 0 || swap >= next.length) return current
      ;[next[index], next[swap]] = [next[swap]!, next[index]!]
      return next
    })
  }

  async function upload(file: File, apply: (url: string) => void) {
    try {
      const data = await uploadPlatformImage(file)
      apply(data.url)
      toast('Image uploaded')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not upload image')
    }
  }

  async function save() {
    setBusy(true)
    try {
      await savePlatformSettings({
        ...settings,
        hero: { intervalMs, slides },
        partners: { eyebrow, title, items: partners },
      })
      await refresh()
      toast('Sliders saved')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save sliders')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminPage
      kicker="Site"
      title="Sliders"
      lede="Hero story slides and the partner logo track on the landing page."
      actions={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const fresh = defaultPlatform()
              setIntervalMs(fresh.hero.intervalMs)
              setSlides(fresh.hero.slides)
              setEyebrow(fresh.partners.eyebrow)
              setTitle(fresh.partners.title)
              setPartners(fresh.partners.items)
            }}
          >
            Reset
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save sliders'}
          </button>
        </>
      }
    >
      <section className="admin-card">
        <header className="admin-card-head">
          <div>
            <p className="admin-kind">Hero</p>
            <h2>Timing</h2>
          </div>
        </header>
        <div className="admin-fields">
          <label>
            Auto-advance (ms)
            <input type="number" min={2000} max={20000} step={500} value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value) || 4000)} />
          </label>
        </div>
      </section>

      {slides.map((slide, index) => (
        <section key={slide.id} className="admin-card">
          <header className="admin-card-head">
            <div>
              <p className="admin-kind">Slide {index + 1}</p>
              <h2>{slide.kicker || slide.id}</h2>
            </div>
            <div className="admin-card-meta">
              <button type="button" className="btn btn-ghost btn-small" onClick={() => moveSlide(index, -1)}>
                Up
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => moveSlide(index, 1)}>
                Down
              </button>
              <AdminSwitch
                checked={slide.enabled !== false}
                onChange={(value) => patchSlide(slide.id, { enabled: value })}
              >
                Visible
              </AdminSwitch>
            </div>
          </header>
          <div className="admin-fields">
            <label>
              Kicker
              <input value={slide.kicker} onChange={(e) => patchSlide(slide.id, { kicker: e.target.value })} />
            </label>
            <label>
              Visual overlay
              <select value={slide.visual} onChange={(e) => patchSlide(slide.id, { visual: e.target.value as HeroVisual })}>
                {VISUALS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="full">
              Title
              <input value={slide.title} onChange={(e) => patchSlide(slide.id, { title: e.target.value })} />
            </label>
            <label className="full">
              Emphasis
              <input value={slide.emphasis} onChange={(e) => patchSlide(slide.id, { emphasis: e.target.value })} />
            </label>
            <label className="full">
              Lede
              <textarea rows={3} value={slide.lede} onChange={(e) => patchSlide(slide.id, { lede: e.target.value })} />
            </label>
            <label>
              Metric
              <input value={slide.metric} onChange={(e) => patchSlide(slide.id, { metric: e.target.value })} />
            </label>
            <label>
              Metric label
              <input value={slide.metricLabel} onChange={(e) => patchSlide(slide.id, { metricLabel: e.target.value })} />
            </label>
            <label>
              Sheet
              <input value={slide.sheet} onChange={(e) => patchSlide(slide.id, { sheet: e.target.value })} />
            </label>
            <label>
              Sheet name
              <input value={slide.sheetName} onChange={(e) => patchSlide(slide.id, { sheetName: e.target.value })} />
            </label>
            <label>
              Scale
              <input value={slide.scale} onChange={(e) => patchSlide(slide.id, { scale: e.target.value })} />
            </label>
            <label className="full">
              Image URL
              <input value={slide.image} onChange={(e) => patchSlide(slide.id, { image: e.target.value })} />
            </label>
            <label className="full">
              Replace image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void upload(file, (url) => patchSlide(slide.id, { image: url }))
                }}
              />
            </label>
            {slide.image ? <img className="admin-preview" src={slide.image} alt="" /> : null}
            {slide.pins.map((pin, pinIndex) => (
              <label key={`${slide.id}-pin-${pinIndex}`} className="full">
                Pin {pinIndex + 1} (top, left, kicker, value)
                <div className="admin-pin-row">
                  <input value={pin.top} onChange={(e) => patchPin(slide.id, pinIndex, { top: e.target.value })} />
                  <input value={pin.left} onChange={(e) => patchPin(slide.id, pinIndex, { left: e.target.value })} />
                  <input value={pin.kicker} onChange={(e) => patchPin(slide.id, pinIndex, { kicker: e.target.value })} />
                  <input value={pin.value} onChange={(e) => patchPin(slide.id, pinIndex, { value: e.target.value })} />
                </div>
              </label>
            ))}
          </div>
        </section>
      ))}

      <p className="admin-section-label">Partner slider</p>
      <section className="admin-card">
        <div className="admin-fields">
          <label>
            Eyebrow
            <input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
          </label>
          <label className="full">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
        </div>
      </section>

      {partners.map((partner, index) => (
        <section key={partner.id} className="admin-card">
          <header className="admin-card-head">
            <div>
              <p className="admin-kind">Logo</p>
              <h2>{partner.name || 'Partner'}</h2>
            </div>
            <AdminSwitch
              checked={partner.enabled !== false}
              onChange={(value) =>
                setPartners((current) =>
                  current.map((item, i) => (i === index ? { ...item, enabled: value } : item)),
                )
              }
            >
              Visible
            </AdminSwitch>
          </header>
          <div className="admin-fields">
            <label>
              Name
              <input
                value={partner.name}
                onChange={(e) =>
                  setPartners((current) => current.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))
                }
              />
            </label>
            <label className="full">
              Logo URL
              <input
                value={partner.src}
                onChange={(e) =>
                  setPartners((current) => current.map((item, i) => (i === index ? { ...item, src: e.target.value } : item)))
                }
              />
            </label>
            <label className="full">
              Replace logo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    void upload(file, (url) =>
                      setPartners((current) => current.map((item, i) => (i === index ? { ...item, src: url } : item))),
                    )
                  }
                }}
              />
            </label>
            {partner.src ? <img className="admin-logo-preview" src={partner.src} alt="" /> : null}
          </div>
        </section>
      ))}

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          setPartners((current) => [
            ...current,
            { id: `partner-${Date.now()}`, enabled: true, name: 'New partner', src: '' },
          ])
        }
      >
        Add partner
      </button>
    </AdminPage>
  )
}
