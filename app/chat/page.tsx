import ChatSimulator from "@/components/chat/ChatSimulator";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chat & Twin Engine | Aman Bhaskar",
    description: "Interact with Aman's Digital Twin and Assistant via a real-time streaming RAG engine.",
};

export default function ChatPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <ChatSimulator />
        </main>
    );
}
