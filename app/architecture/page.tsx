import Navbar from "@/components/layout/Navbar";
import ArchitectureHeader from "@/components/architecture/Header";
import SystemOverview from "@/components/architecture/SystemOverview";
import ArchitectureDiagram from "@/components/architecture/Diagram";
import RAGFlow from "@/components/architecture/RAGFlow";
import GitHubFlow from "@/components/architecture/GitHubFlow";
import VoiceFlow from "@/components/architecture/VoiceFlow";
import DeploymentStack from "@/components/architecture/DeploymentStack";
import Observability from "@/components/architecture/Observability";

export default function ArchitecturePage() {
    return (
        <main className="min-h-screen bg-bg-base selection:bg-accent/30 selection:text-white">
            <Navbar />
            <ArchitectureHeader />

            <div className="w-full max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <SystemOverview />
            <ArchitectureDiagram />

            <div className="w-full max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <RAGFlow />
            <GitHubFlow />

            <div className="w-full max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <VoiceFlow />
            <DeploymentStack />

            <div className="w-full max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <Observability />
        </main>
    );
}
