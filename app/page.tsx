import Navigation from '@/components/portfolio/Navigation'
import Hero from '@/components/portfolio/Hero'
import About from '@/components/portfolio/About'
import Projects from '@/components/portfolio/Projects'
import Skills from '@/components/portfolio/Skills'
import Chat from '@/components/portfolio/Chat'
import Contact from '@/components/portfolio/Contact'
import { CustomCursor } from '@/components/portfolio/CustomCursor'
import { Marquee } from '@/components/portfolio/Marquee'
import { Stats } from '@/components/portfolio/Stats'

export default function Home() {
  return (
    <main className="min-h-screen">
      <CustomCursor />
      <Navigation />
      <Hero />
      <Marquee />
      <Projects />
      <Stats />
      <About />
      <Skills />
      <Chat />
      <Contact />
    </main>
  )
}
