'use client'

import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { PainSection, SolutionSection, FeaturesSection, HowSection } from './LandingSections'
import { PricingSection } from './LandingPricing'
import { DisclaimerBand, FinalCta, LandingFooter } from './LandingFooter'

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      <LandingNav />
      <main>
        <LandingHero />
        <PainSection />
        <SolutionSection />
        <FeaturesSection />
        <HowSection />
        <PricingSection />
        <DisclaimerBand />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
