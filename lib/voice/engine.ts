/**
 * Voice Engine — Browser-Native TTS
 *
 * Uses Web Speech API for zero-dependency, M1-optimized voice output.
 * Supports interruption, voice selection, and speech events.
 */

export interface VoiceEngineCallbacks {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
}

/**
 * Speaks text using browser TTS. Returns a promise that resolves when done.
 */
export function speak(text: string, callbacks?: VoiceEngineCallbacks): Promise<void> {
    return new Promise((resolve) => {
        if (!("speechSynthesis" in window)) {
            callbacks?.onError?.("Speech synthesis not supported");
            resolve();
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = "en-US";

        // Try to find a good voice
        const voices = speechSynthesis.getVoices();
        const preferred = voices.find(
            v => v.name.includes("Samantha") || v.name.includes("Alex") ||
                v.name.includes("Google") || v.name.includes("Enhanced")
        );
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => callbacks?.onStart?.();
        utterance.onend = () => { callbacks?.onEnd?.(); resolve(); };
        utterance.onerror = (e) => {
            callbacks?.onError?.(e.error);
            resolve();
        };

        speechSynthesis.speak(utterance);
    });
}

/**
 * Immediately stops all speech.
 */
export function stopSpeaking(): void {
    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }
}

/**
 * Checks if TTS is currently speaking.
 */
export function isSpeaking(): boolean {
    if ("speechSynthesis" in window) {
        return speechSynthesis.speaking;
    }
    return false;
}
