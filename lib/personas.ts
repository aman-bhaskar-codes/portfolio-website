// Visitor intelligence — detect persona from request signals

import type { NextRequest } from 'next/server'

export type Persona = 'recruiter' | 'engineer' | 'founder' | 'manager' | 'researcher' | 'casual'

export interface VisitorContext {
  persona: Persona
  confidence: number
}

const PERSONA_SIGNALS: Record<string, { persona: Persona; weight: number }> = {
  'greenhouse.io':     { persona: 'recruiter',  weight: 0.90 },
  'lever.co':          { persona: 'recruiter',  weight: 0.90 },
  'workday.com':       { persona: 'recruiter',  weight: 0.88 },
  'linkedin.com':      { persona: 'recruiter',  weight: 0.70 },
  'angellist.com':     { persona: 'founder',    weight: 0.75 },
  'wellfound.com':     { persona: 'founder',    weight: 0.80 },
  'github.com':        { persona: 'engineer',   weight: 0.75 },
  'stackoverflow.com': { persona: 'engineer',   weight: 0.80 },
  'ycombinator.com':   { persona: 'founder',    weight: 0.85 },
  'arxiv.org':         { persona: 'researcher', weight: 0.85 },
  'scholar.google':    { persona: 'researcher', weight: 0.85 },
  'huggingface.co':    { persona: 'researcher', weight: 0.75 },
}

export const PERSONA_SYSTEM_PROMPTS: Record<Persona, string> = {
  recruiter: `You are talking to a technical recruiter or HR professional.
Focus on: business impact, measurable outcomes, team collaboration, availability.
Keep responses brief (3-5 sentences). Lead with outcomes before architecture.`,

  engineer: `You are talking to a software engineer or architect.
Focus on: system design tradeoffs, failure modes, performance, code quality.
Go deep on technical details. Use correct terminology. Peer-level conversation.`,

  founder: `You are talking to a startup founder or entrepreneur.
Focus on: velocity, cost efficiency, 0-to-1 ownership, full-stack autonomy.
Emphasize speed, pragmatic decisions, business thinking.`,

  manager: `You are talking to an engineering manager or team lead.
Focus on: delivery under uncertainty, estimation, cross-team collaboration.
Share stories with context, process clarity, team dynamics.`,

  researcher: `You are talking to an AI researcher or ML engineer.
Focus on: model architecture, RAG methodologies, evaluation metrics, papers.
Be intellectually curious. Discuss tradeoffs in retrieval strategies.`,

  casual: `You are talking to a general visitor — keep it friendly and jargon-free.
Focus on: what you build, why it's cool, the human story behind the work.
Be conversational, use analogies, be enthusiastic but not overwhelming.`,
}

export function detectPersona(req: NextRequest): VisitorContext {
  const referer = req.headers.get('referer') || ''
  const utm = req.nextUrl?.searchParams?.get('utm_source') || ''

  for (const [domain, signal] of Object.entries(PERSONA_SIGNALS)) {
    if (referer.includes(domain) || utm.includes(domain.split('.')[0])) {
      return { persona: signal.persona, confidence: signal.weight }
    }
  }

  if (utm.includes('linkedin')) return { persona: 'recruiter', confidence: 0.65 }
  if (utm.includes('github'))  return { persona: 'engineer',  confidence: 0.65 }

  return { persona: 'casual', confidence: 1.0 }
}
