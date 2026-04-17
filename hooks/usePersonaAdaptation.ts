"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * ═══════════════════════════════════════════════════════════
 * Persona-Adaptive Hook (§13.1)
 * ═══════════════════════════════════════════════════════════
 *
 * Reads visitor persona from cookie (set by backend on first
 * load) and returns UI adaptations without flash.
 *
 * Adaptations per persona:
 *   - Hero CTA text
 *   - Featured projects order
 *   - Chat placeholder text
 *   - Feature visibility (brief CTA, interview mode, GitHub stats)
 */

export type VisitorPersona =
  | "technical_recruiter"
  | "engineering_manager"
  | "senior_engineer"
  | "startup_founder"
  | "oss_contributor"
  | "casual";

export interface PersonaAdaptation {
  persona: VisitorPersona;
  heroCTAText: string;
  heroCTASecondary: string;
  chatPlaceholder: string;
  showRecruiterBriefCTA: boolean;
  showInterviewModeCTA: boolean;
  showGitHubStatsProminent: boolean;
  featuredProjectsOrder: string[];
  greeting: string;
}

const PERSONA_ADAPTATIONS: Record<VisitorPersona, Omit<PersonaAdaptation, "persona">> = {
  technical_recruiter: {
    heroCTAText: "Check Availability",
    heroCTASecondary: "Download Recruiter Brief",
    chatPlaceholder: "Ask about experience, stack, or availability...",
    showRecruiterBriefCTA: true,
    showInterviewModeCTA: false,
    showGitHubStatsProminent: false,
    featuredProjectsOrder: ["ANTIGRAVITY OS", "AutoResearch", "ForgeAI"],
    greeting: "Hi! I can help you understand Aman's experience and availability.",
  },
  engineering_manager: {
    heroCTAText: "See Engineering Impact",
    heroCTASecondary: "View Architecture Decisions",
    chatPlaceholder: "Ask about leadership, delivery, or team impact...",
    showRecruiterBriefCTA: false,
    showInterviewModeCTA: true,
    showGitHubStatsProminent: false,
    featuredProjectsOrder: ["AutoResearch", "ANTIGRAVITY OS", "ForgeAI"],
    greeting: "Hey! Happy to discuss project impact and engineering approach.",
  },
  senior_engineer: {
    heroCTAText: "Let's Talk Architecture",
    heroCTASecondary: "Try Interview Mode",
    chatPlaceholder: "Go deep on any project or system design...",
    showRecruiterBriefCTA: false,
    showInterviewModeCTA: true,
    showGitHubStatsProminent: true,
    featuredProjectsOrder: ["ANTIGRAVITY OS", "ForgeAI", "AutoResearch"],
    greeting: "Hey — go deep on anything. I can do live code walkthroughs too.",
  },
  startup_founder: {
    heroCTAText: "Let's Build Something",
    heroCTASecondary: "See Full-Stack Work",
    chatPlaceholder: "Ask about shipping fast, full-stack ownership...",
    showRecruiterBriefCTA: false,
    showInterviewModeCTA: false,
    showGitHubStatsProminent: true,
    featuredProjectsOrder: ["ForgeAI", "ANTIGRAVITY OS", "AutoResearch"],
    greeting: "Hey! I love building from zero to production. What are you working on?",
  },
  oss_contributor: {
    heroCTAText: "Explore My Code",
    heroCTASecondary: "View Contributions",
    chatPlaceholder: "Ask about code, contributions, or collaboration...",
    showRecruiterBriefCTA: false,
    showInterviewModeCTA: false,
    showGitHubStatsProminent: true,
    featuredProjectsOrder: ["ANTIGRAVITY OS", "AutoResearch", "ForgeAI"],
    greeting: "Welcome! Feel free to explore the code — I can walk through any repo.",
  },
  casual: {
    heroCTAText: "Explore My Work",
    heroCTASecondary: "Start a Conversation",
    chatPlaceholder: "Ask me anything about Aman's work...",
    showRecruiterBriefCTA: false,
    showInterviewModeCTA: false,
    showGitHubStatsProminent: false,
    featuredProjectsOrder: ["ANTIGRAVITY OS", "AutoResearch", "ForgeAI"],
    greeting: "Hi! I'm Aman's AI assistant. Ask me anything about his work.",
  },
};

function getPersonaFromCookie(): VisitorPersona {
  if (typeof document === "undefined") return "casual";
  const match = document.cookie.match(/visitor_persona=([^;]+)/);
  if (match && match[1] in PERSONA_ADAPTATIONS) {
    return match[1] as VisitorPersona;
  }
  return "casual";
}

export function usePersonaAdaptation(): PersonaAdaptation {
  const [persona, setPersona] = useState<VisitorPersona>("casual");

  useEffect(() => {
    setPersona(getPersonaFromCookie());
  }, []);

  const adaptation = useMemo<PersonaAdaptation>(
    () => ({
      persona,
      ...PERSONA_ADAPTATIONS[persona],
    }),
    [persona]
  );

  return adaptation;
}

export default usePersonaAdaptation;
