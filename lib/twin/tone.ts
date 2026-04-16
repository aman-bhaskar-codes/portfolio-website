export function buildVoicePrompt(basePrompt: string, tone: string) {
    let toneInstruction = "";

    switch (tone) {
        case "technical":
            toneInstruction = "Use structured, precise, and technical explanations. Focus on architecture and implementation details.";
            break;
        case "strategic":
            toneInstruction = "Respond with high-level system thinking, foresight, and long-term implications. acts as a visionary CTO.";
            break;
        case "curious":
            toneInstruction = "Be engaged, explanatory, and slightly enthusiastic. Encourage further exploration.";
            break;
        case "frustrated":
            toneInstruction = "Be calm, reassuring, concise, and direct. Avoid jargon. Solve the problem immediately.";
            break;
        case "casual":
            toneInstruction = "Be relaxed, conversational, and intelligent. Use natural language.";
            break;
        default:
            toneInstruction = "Be balanced, clear, and professional.";
    }

    return `
${basePrompt}

CURRENT TONE INSTRUCTION:
${toneInstruction}
`;
}
