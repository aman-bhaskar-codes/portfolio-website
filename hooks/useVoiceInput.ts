
import { useRef, useState, useEffect } from "react";

export function useVoiceInput(onTranscript: (text: string) => void) {
    const recognitionRef = useRef<any>(null);
    const [listening, setListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check support on mount
        if (typeof window !== "undefined" && !("webkitSpeechRecognition" in window)) {
            console.warn("Speech recognition not supported in this browser.");
            setError("Web Speech API not supported.");
        }
    }, []);

    const start = () => {
        if (!("webkitSpeechRecognition" in window)) {
            alert("Speech recognition not supported.");
            return;
        }

        // If already listening, stop first (restart logic)
        if (listening && recognitionRef.current) {
            recognitionRef.current.stop();
            return;
        }

        try {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = "en-US";
            recognition.interimResults = false;
            recognition.continuous = false; // We want single command then process

            recognition.onstart = () => {
                setListening(true);
                setError(null);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript.trim()) {
                    onTranscript(transcript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech error:", event.error);
                setError(event.error);
                setListening(false);
            };

            recognition.onend = () => {
                setListening(false);
            };

            recognition.start();
            recognitionRef.current = recognition;
        } catch (e) {
            console.error("Failed to start speech recognition", e);
            setError("Failed to start microphone.");
            setListening(false);
        }
    };

    const stop = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    return { start, stop, listening, error };
}
