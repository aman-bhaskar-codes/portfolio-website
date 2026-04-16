import ResearchDashboard from "@/components/research/ResearchDashboard";
import Container from "@/components/layout/Container";

export const metadata = {
    title: "AI Research Lab | Aman Bhaskar",
    description: "Continuous autonomous experimentation, reinforcement learning, and cognitive optimization of the Digital Twin system.",
};

export default function ResearchPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-core-primary)] pt-24 pb-16">
            <Container>
                <ResearchDashboard />
            </Container>
        </main>
    );
}
