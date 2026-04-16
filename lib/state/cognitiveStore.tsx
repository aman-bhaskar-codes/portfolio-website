"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type Hypothesis = {
    id: string;
    title: string;
    status: "active" | "validated" | "rejected";
    impact: number;
};

export type SwarmScore = {
    twin: string;
    score: number;
};

export type CognitiveState = {
    activeTwin: string | null;
    activeClusters: number;
    debateIntensity: number;
    reward: number;
    autonomyMode: "passive" | "advisory" | "full";
    viewMode: "overview" | "swarm" | "memory" | "research";

    rewardHistory: number[];
    swarmScores: SwarmScore[];
    activeHypotheses: Hypothesis[];
    identityStability: number;
    hallucinationRate: number;
};

const defaultState: CognitiveState = {
    activeTwin: "architecture",
    activeClusters: 4,
    debateIntensity: 0.2,
    reward: 0.85,
    autonomyMode: "advisory",
    viewMode: "overview",

    rewardHistory: [0.72, 0.76, 0.81, 0.84, 0.85],
    swarmScores: [
        { twin: "Architecture", score: 0.85 },
        { twin: "Research", score: 0.78 },
        { twin: "Safety", score: 0.91 },
        { twin: "Performance", score: 0.73 }
    ],
    activeHypotheses: [
        {
            id: "h1",
            title: "Entropy-weighted retrieval",
            status: "active",
            impact: 0.05
        }
    ],
    identityStability: 0.94,
    hallucinationRate: 0.04
};

type CognitiveContextType = {
    state: CognitiveState;
    setState: React.Dispatch<React.SetStateAction<CognitiveState>>;
    simulateActivity: () => void;
    refreshState: () => void;
};

const CognitiveContext = createContext<CognitiveContextType | null>(null);

export function CognitiveProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<CognitiveState>(defaultState);

    // Fetch real cognitive state from the API
    const refreshState = useCallback(() => {
        fetch("/api/cognitive/state")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                setState(prev => ({
                    ...prev,
                    activeTwin: data.activeTwin ?? prev.activeTwin,
                    activeClusters: data.activeClusters ?? prev.activeClusters,
                    debateIntensity: data.debateIntensity ?? prev.debateIntensity,
                    reward: data.reward ?? prev.reward,
                    autonomyMode: data.autonomyMode ?? prev.autonomyMode,
                    rewardHistory: data.rewardHistory ?? prev.rewardHistory,
                    swarmScores: data.swarmScores ?? prev.swarmScores,
                    activeHypotheses: data.activeHypotheses ?? prev.activeHypotheses,
                    identityStability: data.identityStability ?? prev.identityStability,
                    hallucinationRate: data.hallucinationRate ?? prev.hallucinationRate,
                }));
            })
            .catch(() => { /* Silently use defaults */ });
    }, []);

    // Poll every 10 seconds for live data
    useEffect(() => {
        refreshState(); // Initial fetch
        const interval = setInterval(refreshState, 10_000);
        return () => clearInterval(interval);
    }, [refreshState]);

    // Keep simulateActivity for backwards compatibility (now just triggers a refresh)
    const simulateActivity = useCallback(() => {
        refreshState();
    }, [refreshState]);

    return (
        <CognitiveContext.Provider value={{ state, setState, simulateActivity, refreshState }}>
            {children}
        </CognitiveContext.Provider>
    );
}


export function useCognitive() {
    const context = useContext(CognitiveContext);
    if (!context) {
        throw new Error("useCognitive must be used within a CognitiveProvider");
    }
    return context;
}
