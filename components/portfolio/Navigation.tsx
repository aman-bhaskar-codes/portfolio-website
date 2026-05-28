export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[500] flex justify-between items-center px-6 py-6 md:px-12 md:py-7 mix-blend-difference pointer-events-none">
      <div className="flex gap-6 md:gap-10 pointer-events-auto">
        <a href="#projects" className="text-white no-underline text-[0.78rem] font-semibold tracking-[0.12em] uppercase opacity-65 hover:opacity-100 transition-opacity">Projects</a>
        <a href="#skills" className="text-white no-underline text-[0.78rem] font-semibold tracking-[0.12em] uppercase opacity-65 hover:opacity-100 transition-opacity">Skills</a>
      </div>
      <div className="flex gap-6 md:gap-10 pointer-events-auto">
        <a href="#about" className="text-white no-underline text-[0.78rem] font-semibold tracking-[0.12em] uppercase opacity-65 hover:opacity-100 transition-opacity">About</a>
        <a href="#contact" className="text-white no-underline text-[0.78rem] font-semibold tracking-[0.12em] uppercase opacity-65 hover:opacity-100 transition-opacity">Contact</a>
      </div>
    </nav>
  )
}
