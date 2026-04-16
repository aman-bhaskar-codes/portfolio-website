import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    theme: 'luxury' | 'deeplab';
    motion: 'on' | 'reduced';
    verbosity: 'concise' | 'balanced' | 'deep';
    voiceEnabled: boolean;
    threeDIntensity: 'low' | 'medium' | 'high' | 'off';
    selectedModel: string;

    setTheme: (theme: 'luxury' | 'deeplab') => void;
    setMotion: (motion: 'on' | 'reduced') => void;
    setVerbosity: (verbosity: 'concise' | 'balanced' | 'deep') => void;
    setVoiceEnabled: (enabled: boolean) => void;
    setThreeDIntensity: (intensity: 'low' | 'medium' | 'high' | 'off') => void;
    setSelectedModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'luxury',
            motion: 'on',
            verbosity: 'balanced',
            voiceEnabled: false,
            threeDIntensity: 'high',
            selectedModel: 'qwen2.5:3b',

            setTheme: (theme) => set({ theme }),
            setMotion: (motion) => set({ motion }),
            setVerbosity: (verbosity) => set({ verbosity }),
            setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
            setThreeDIntensity: (threeDIntensity) => set({ threeDIntensity }),
            setSelectedModel: (selectedModel) => set({ selectedModel }),
        }),
        {
            name: 'identity-settings',
        }
    )
);
