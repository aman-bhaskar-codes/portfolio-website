import Navbar from "@/components/layout/Navbar";
import AboutHeader from "@/components/about/Header";
import TechnicalPositioning from "@/components/about/TechnicalPositioning";
import Timeline from "@/components/about/Timeline";
import Competencies from "@/components/about/Competencies";
import Philosophy from "@/components/about/Philosophy";
import Mission from "@/components/about/Mission";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-bg-base selection:bg-accent/30 selection:text-white">
            <Navbar />
            <AboutHeader />

            <div className="w-full max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <TechnicalPositioning />
            <Timeline />

            <div className="w-full max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <Competencies />
            <Philosophy />
            <Mission />
        </main>
    );
}
