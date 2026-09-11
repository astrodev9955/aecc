export interface Country {
  iso: string
  name: string
  dial: string
}

export const COUNTRIES: Country[] = [
  { iso: 'US', name: 'United States', dial: '1' },
  { iso: 'CA', name: 'Canada', dial: '1' },
  { iso: 'GB', name: 'United Kingdom', dial: '44' },
  { iso: 'AU', name: 'Australia', dial: '61' },
  { iso: 'NZ', name: 'New Zealand', dial: '64' },
  { iso: 'IE', name: 'Ireland', dial: '353' },
  { iso: 'DE', name: 'Germany', dial: '49' },
  { iso: 'FR', name: 'France', dial: '33' },
  { iso: 'ES', name: 'Spain', dial: '34' },
  { iso: 'IT', name: 'Italy', dial: '39' },
  { iso: 'NL', name: 'Netherlands', dial: '31' },
  { iso: 'BE', name: 'Belgium', dial: '32' },
  { iso: 'PT', name: 'Portugal', dial: '351' },
  { iso: 'CH', name: 'Switzerland', dial: '41' },
  { iso: 'AT', name: 'Austria', dial: '43' },
  { iso: 'SE', name: 'Sweden', dial: '46' },
  { iso: 'NO', name: 'Norway', dial: '47' },
  { iso: 'DK', name: 'Denmark', dial: '45' },
  { iso: 'FI', name: 'Finland', dial: '358' },
  { iso: 'PL', name: 'Poland', dial: '48' },
  { iso: 'CZ', name: 'Czechia', dial: '420' },
  { iso: 'RO', name: 'Romania', dial: '40' },
  { iso: 'GR', name: 'Greece', dial: '30' },
  { iso: 'HU', name: 'Hungary', dial: '36' },
  { iso: 'UA', name: 'Ukraine', dial: '380' },
  { iso: 'TR', name: 'Türkiye', dial: '90' },
  { iso: 'RU', name: 'Russia', dial: '7' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '966' },
  { iso: 'QA', name: 'Qatar', dial: '974' },
  { iso: 'IL', name: 'Israel', dial: '972' },
  { iso: 'ZA', name: 'South Africa', dial: '27' },
  { iso: 'NG', name: 'Nigeria', dial: '234' },
  { iso: 'KE', name: 'Kenya', dial: '254' },
  { iso: 'EG', name: 'Egypt', dial: '20' },
  { iso: 'MA', name: 'Morocco', dial: '212' },
  { iso: 'GH', name: 'Ghana', dial: '233' },
  { iso: 'IN', name: 'India', dial: '91' },
  { iso: 'PK', name: 'Pakistan', dial: '92' },
  { iso: 'BD', name: 'Bangladesh', dial: '880' },
  { iso: 'LK', name: 'Sri Lanka', dial: '94' },
  { iso: 'CN', name: 'China', dial: '86' },
  { iso: 'JP', name: 'Japan', dial: '81' },
  { iso: 'KR', name: 'South Korea', dial: '82' },
  { iso: 'TW', name: 'Taiwan', dial: '886' },
  { iso: 'HK', name: 'Hong Kong', dial: '852' },
  { iso: 'SG', name: 'Singapore', dial: '65' },
  { iso: 'MY', name: 'Malaysia', dial: '60' },
  { iso: 'ID', name: 'Indonesia', dial: '62' },
  { iso: 'TH', name: 'Thailand', dial: '66' },
  { iso: 'VN', name: 'Vietnam', dial: '84' },
  { iso: 'PH', name: 'Philippines', dial: '63' },
  { iso: 'MX', name: 'Mexico', dial: '52' },
  { iso: 'BR', name: 'Brazil', dial: '55' },
  { iso: 'AR', name: 'Argentina', dial: '54' },
  { iso: 'CL', name: 'Chile', dial: '56' },
  { iso: 'CO', name: 'Colombia', dial: '57' },
  { iso: 'PE', name: 'Peru', dial: '51' },
  { iso: 'CR', name: 'Costa Rica', dial: '506' },
  { iso: 'PA', name: 'Panama', dial: '507' },
  { iso: 'DO', name: 'Dominican Republic', dial: '1' },
  { iso: 'JM', name: 'Jamaica', dial: '1' },
  { iso: 'TT', name: 'Trinidad and Tobago', dial: '1' },
  { iso: 'PR', name: 'Puerto Rico', dial: '1' },
]

export function isCountryIso(value: string): boolean {
  return COUNTRIES.some((item) => item.iso === value)
}

export function getCountry(iso: string | null | undefined): Country {
  return COUNTRIES.find((item) => item.iso === iso) ?? COUNTRIES[0]!
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function toE164(iso: string, national: string): string {
  const country = getCountry(iso)
  const local = digitsOnly(national).replace(new RegExp(`^${country.dial}`), '')
  return `+${country.dial}${local}`
}

export function isValidNationalNumber(iso: string, national: string): boolean {
  const local = digitsOnly(national)
  if (local.length < 6 || local.length > 15) return false
  const e164 = toE164(iso, local)
  return /^\+[1-9]\d{7,14}$/.test(e164)
}
