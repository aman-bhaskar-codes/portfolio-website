import { Navbar } from '@/components/ui/Navbar'
import { Hero } from '@/components/sections/Hero'
import { MarqueeStrip } from '@/components/sections/MarqueeStrip'
import { FeaturedProjects } from '@/components/sections/FeaturedProjects'
import { AboutStory } from '@/components/sections/AboutStory'
import { Capabilities } from '@/components/sections/Capabilities'
import { StatsSection } from '@/components/sections/StatsSection'
import { DigitalTwinChat } from '@/components/sections/DigitalTwinChat'
import { ContactSection } from '@/components/sections/ContactSection'
import { Footer } from '@/components/ui/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <MarqueeStrip />
      <FeaturedProjects />
      <AboutStory />
      <Capabilities />
      <StatsSection />
      <DigitalTwinChat />
      <ContactSection />
      <Footer />
    </main>
  )
}
