import type { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/HeroSection'
import { WhyBookDirect } from '@/components/marketing/WhyBookDirect'
import { RoomsPreview } from '@/components/marketing/RoomsPreview'
import { ExperienceSection } from '@/components/marketing/ExperienceSection'
import { LocationSection } from '@/components/marketing/LocationSection'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { getSiteSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: "Sofia's on the Beach — Pousada Boutique em Búzios",
  description:
    "Hospede-se de frente para o mar em Búzios. Reserve diretamente e garanta a melhor tarifa na pousada boutique Sofia's on the Beach.",
}

export default async function HomePage() {
  const settings = await getSiteSettings()

  return (
    <>
      <HeroSection whatsapp={settings.whatsapp} onlineBookingEnabled={settings.onlineBookingEnabled} />
      <WhyBookDirect />
      <RoomsPreview />
      <ExperienceSection />
      <LocationSection whatsapp={settings.whatsapp} />
      <FinalCTA whatsapp={settings.whatsapp} />
    </>
  )
}
