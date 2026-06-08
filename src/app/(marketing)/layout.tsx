import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { WhatsAppButton } from '@/components/shared/WhatsAppButton'
import { getSiteSettings } from '@/lib/settings'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()

  return (
    <>
      <Header />
      <main className="flex-1 pt-[64px] md:pt-[92px]">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton settings={settings} />
    </>
  )
}
