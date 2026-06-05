import type { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/HeroSection'
import { BookingWidget } from '@/components/marketing/BookingWidget'
import { WhyBookDirect } from '@/components/marketing/WhyBookDirect'
import { RoomsPreview } from '@/components/marketing/RoomsPreview'
import { ExperienceSection } from '@/components/marketing/ExperienceSection'
import { LocationSection } from '@/components/marketing/LocationSection'
import { FinalCTA } from '@/components/marketing/FinalCTA'

export const metadata: Metadata = {
  title: "Sofia's on the Beach — Pousada Boutique em Búzios",
  description:
    "Hospede-se de frente para o mar em Búzios. Reserve diretamente e garanta a melhor tarifa na pousada boutique Sofia's on the Beach.",
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BookingWidget />
      <WhyBookDirect />
      <RoomsPreview />
      <ExperienceSection />
      <LocationSection />
      <FinalCTA />
    </>
  )
}
