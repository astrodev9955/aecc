import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react'
import * as Flags from 'country-flag-icons/react/3x2'
import { COUNTRIES, getCountry, type Country } from '../data/countries'

function Chevron() {
  return (
    <svg className="phone-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.4 4.3 6 7.7l3.6-3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Check() {
  return (
    <svg className="phone-check" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2.5 7.2 5.6 10.2 11.5 3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type FlagSvg = ComponentType<SVGProps<SVGSVGElement>>

function CountryFlag({ iso }: { iso: string }) {
  const Flag = (Flags as Record<string, FlagSvg | undefined>)[iso]
  if (!Flag) {
    return (
      <span className="phone-mark" aria-hidden="true">
        {iso}
      </span>
    )
  }
  return <Flag className="phone-flag" aria-hidden="true" />
}

export function PhoneField({
  countryIso,
  national,
  onCountry,
  onNational,
}: {
  countryIso: string
  national: string
  onCountry: (iso: string) => void
  onNational: (value: string) => void
}) {
  const country = getCountry(countryIso)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.iso.toLowerCase().includes(q) ||
        item.dial.includes(q.replace('+', '')),
    )
  }, [query])

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (open) search.current?.focus()
    else setQuery('')
  }, [open])

  function choose(item: Country) {
    onCountry(item.iso)
    setOpen(false)
  }

  return (
    <div className="phone-field" ref={root}>
      <div className={`phone-shell${open ? ' is-open' : ''}`}>
        <button
          type="button"
          className="phone-country-btn"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Country, ${country.name} +${country.dial}`}
          onClick={() => setOpen((current) => !current)}
        >
          <CountryFlag iso={country.iso} />
          <span className="phone-dial">+{country.dial}</span>
          <Chevron />
        </button>
        <span className="phone-divider" aria-hidden="true" />
        <input
          className="phone-number"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="415 555 0134"
          value={national}
          onChange={(e) => onNational(e.target.value)}
          required
          aria-label="Phone number"
        />
      </div>
      {open && (
        <div className="phone-country-menu" role="listbox" aria-label="Country">
          <input
            ref={search}
            className="phone-country-search"
            type="search"
            placeholder="Search country or code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search country"
          />
          <ul>
            {matches.map((item) => {
              const active = item.iso === country.iso
              return (
                <li key={item.iso}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={active ? 'is-active' : ''}
                    onClick={() => choose(item)}
                  >
                    <CountryFlag iso={item.iso} />
                    <span className="phone-country-name">{item.name}</span>
                    <small>+{item.dial}</small>
                    {active ? <Check /> : <span className="phone-check-spacer" />}
                  </button>
                </li>
              )
            })}
            {matches.length === 0 && <li className="phone-empty">No country matches</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
