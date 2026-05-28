import Navigation from '@/components/portfolio/Navigation';
import Hero from '@/components/portfolio/Hero';
import { Marquee } from '@/components/portfolio/Marquee';
import Projects from '@/components/portfolio/Projects';
import { Stats } from '@/components/portfolio/Stats';
import About from '@/components/portfolio/About';
import Skills from '@/components/portfolio/Skills';
import ContactCTA from '@/components/portfolio/ContactCTA';
import PageTransition from '@/components/portfolio/PageTransition';
import Chat from '@/components/portfolio/Chat';

export default function Home() {
  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navigation />
        <Hero />
        <Marquee />
        <Projects />
        <Stats />
        <About />
        <Skills />
        <ContactCTA />
        <Chat />
      </main>
    </PageTransition>
  )
}
