import { SmoothScroll } from '@/components/cinematic/SmoothScroll'
import { Preloader } from '@/components/cinematic/Preloader'
import { CinematicNav } from '@/components/cinematic/CinematicNav'
import { CinematicHero } from '@/components/cinematic/CinematicHero'
import { TechMarquee } from '@/components/cinematic/TechMarquee'
import { CinematicStats } from '@/components/cinematic/CinematicStats'
import { ProjectsShowcase } from '@/components/cinematic/ProjectsShowcase'
import { CapabilitiesGrid } from '@/components/cinematic/CapabilitiesGrid'
import { TwinChatSection } from '@/components/cinematic/TwinChatSection'
import { ContactFooter } from '@/components/cinematic/ContactFooter'

export default function HomePage() {
  return (
    <SmoothScroll>
      <Preloader />
      <div className="film-grain" aria-hidden="true" />
      <CinematicNav />
      <main>
        <CinematicHero />
        <TechMarquee />
        <CinematicStats />
        <ProjectsShowcase />
        <CapabilitiesGrid />
        <TwinChatSection />
      </main>
      <ContactFooter />
    </SmoothScroll>
  )
}
