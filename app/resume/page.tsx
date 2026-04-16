import Navbar from "@/components/layout/Navbar";
import ResumeHeader from "@/components/resume/Header";
import Experience from "@/components/resume/Experience";
import TechStack from "@/components/resume/TechStack";
import Education from "@/components/resume/Education";
import AIExpertise from "@/components/resume/AIExpertise";

export default function ResumePage() {
    return (
        <main className="min-h-screen bg-bg-base selection:bg-accent/30 selection:text-white">
            <Navbar />
            <ResumeHeader />

            <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <Experience />
            <TechStack />

            <div className="w-full max-w-5xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <Education />
            <AIExpertise />
        </main>
    );
}
