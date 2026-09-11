import { HERO_SLIDES, PARTNERS, PARTNER_COPY, type HeroSlide, type PartnerItem } from './content'
import { PAYMENT_METHODS, publicPayment, type PaymentMethod } from './payments'
import { PLAN_RECOMMENDATIONS, PLANS, TRIAL_DAYS, type Plan } from './plans'

export interface PlatformSettings {
  trialDays: number
  plans: Plan[]
  recommendations: typeof PLAN_RECOMMENDATIONS
  payments: PaymentMethod[]
  hero: {
    intervalMs: number
    slides: HeroSlide[]
  }
  partners: {
    eyebrow: string
    title: string
    items: PartnerItem[]
  }
}

export function defaultPlatform(): PlatformSettings {
  return {
    trialDays: TRIAL_DAYS,
    plans: PLANS.map((plan) => ({ ...plan, features: [...plan.features] })),
    recommendations: PLAN_RECOMMENDATIONS.map((item) => ({ ...item })),
    payments: PAYMENT_METHODS.map((item) => ({ ...item, integration: { ...item.integration } })),
    hero: {
      intervalMs: 4000,
      slides: HERO_SLIDES.map((slide) => ({ ...slide, pins: slide.pins.map((pin) => ({ ...pin })) })),
    },
    partners: {
      eyebrow: PARTNER_COPY.eyebrow,
      title: PARTNER_COPY.title,
      items: PARTNERS.map((item) => ({ ...item })),
    },
  }
}

export function visiblePlans(settings: PlatformSettings): Plan[] {
  return settings.plans.filter((plan) => plan.enabled !== false && plan.id !== 'free' && plan.price > 0)
}

export function visiblePayments(settings: PlatformSettings): PaymentMethod[] {
  return settings.payments.filter((item) => item.enabled !== false)
}

export function visibleHeroSlides(settings: PlatformSettings): HeroSlide[] {
  return settings.hero.slides.filter((slide) => slide.enabled !== false)
}

export function visiblePartners(settings: PlatformSettings): PartnerItem[] {
  return settings.partners.items.filter((item) => item.enabled !== false)
}

export function publicPlatform(settings: PlatformSettings): PlatformSettings {
  return {
    ...settings,
    payments: settings.payments.map(publicPayment),
  }
}
