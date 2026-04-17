'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * Voice Mode Hook — ANTIGRAVITY OS v2 (§26.7)
 * ═══════════════════════════════════════════════════════════
 * 
 * Voice input:  Web Speech API (browser-native, FREE)
 * Voice output: Browser SpeechSynthesis (FREE, no ElevenLabs)
 * 
 * Push-to-talk: hold Space
 * Max response: 500 tokens in voice mode
 * Graceful fallback: text-only if browser doesn't support
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceModeState {
  isSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

interface UseVoiceModeReturn {
  state: VoiceModeState;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  togglePushToTalk: (active: boolean) => void;
}

export function useVoiceMode(): UseVoiceModeReturn {
  const [state, setState] = useState<VoiceModeState>({
    isSupported: false,
    isListening: false,
    isSpeaking: false,
    transcript: '',
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Check browser support
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const hasSpeechRecognition = !!SpeechRecognition;
    const hasSpeechSynthesis = 'speechSynthesis' in window;

    setState(prev => ({
      ...prev,
      isSupported: hasSpeechRecognition && hasSpeechSynthesis,
    }));

    if (hasSpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const results = Array.from(event.results);
        const transcript = results
          .map((result: any) => result[0].transcript)
          .join('');

        setState(prev => ({ ...prev, transcript }));
      };

      recognition.onerror = (event: any) => {
        const errorMap: Record<string, string> = {
          'no-speech': 'No speech detected. Try again.',
          'audio-capture': 'No microphone found.',
          'not-allowed': 'Microphone access denied.',
          'network': 'Network error during recognition.',
        };

        setState(prev => ({
          ...prev,
          isListening: false,
          error: errorMap[event.error] || `Speech error: ${event.error}`,
        }));
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };

      recognitionRef.current = recognition;
    }

    if (hasSpeechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    setState(prev => ({
      ...prev,
      isListening: true,
      transcript: '',
      error: null,
    }));

    try {
      recognitionRef.current.start();
    } catch {
      // Already started
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // Already stopped
    }
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    // Truncate for voice mode (max 500 tokens ≈ 2000 chars)
    const truncated = text.length > 2000 ? text.slice(0, 2000) + '...' : text;

    const utterance = new SpeechSynthesisUtterance(truncated);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a natural English voice
    const voices = synthesisRef.current.getVoices();
    const preferred = voices.find(
      v => v.lang.startsWith('en') && v.name.includes('Daniel')
    ) || voices.find(
      v => v.lang.startsWith('en') && v.localService
    ) || voices.find(
      v => v.lang.startsWith('en')
    );

    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
    };
    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    };
    utterance.onerror = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    synthesisRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const togglePushToTalk = useCallback((active: boolean) => {
    if (active) {
      startListening();
    } else {
      stopListening();
    }
  }, [startListening, stopListening]);

  // Push-to-talk: Space key
  useEffect(() => {
    if (!state.isSupported) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body && !state.isListening) {
        e.preventDefault();
        startListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body && state.isListening) {
        e.preventDefault();
        stopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.isSupported, state.isListening, startListening, stopListening]);

  return {
    state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    togglePushToTalk,
  };
}
