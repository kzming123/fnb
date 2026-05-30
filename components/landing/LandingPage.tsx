'use client'

import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { TrustStrip } from './LandingTrust'
import { AgitateSection, SolutionSection, FeaturesSection, HowSection } from './LandingSections'
import { CostSection } from './LandingCost'
import { ProofSection } from './LandingProof'
import { PricingSection } from './LandingPricing'
import { FaqSection } from './LandingFaq'
import { DisclaimerBand, FinalCta, LandingFooter } from './LandingFooter'
import { StickyCta } from './LandingStickyCta'

/**
 * Public landing page — sales-funnel flow:
 * Hook → trust → agitate → cost of inaction → solution → how → benefits →
 * proof → offer/pricing → objections (FAQ) → final CTA. Sticky CTA on mobile.
 */
export function LandingPage() {
  return (
    <div className="min-h-dvh bg-white pb-20 lg:pb-0">
      <LandingNav />
      <main>
        <LandingHero />
        <TrustStrip />
        <AgitateSection />
        <CostSection />
        <SolutionSection />
        <HowSection />
        <FeaturesSection />
        <ProofSection />
        <PricingSection />
        <FaqSection />
        <DisclaimerBand />
        <FinalCta />
      </main>
      <LandingFooter />
      <StickyCta />
    </div>
  )
}
