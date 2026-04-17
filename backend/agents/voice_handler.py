# backend/agents/voice_handler.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Voice Handler (STT + TTS)
═══════════════════════════════════════════════════════════

STT: faster-whisper (local, free)
TTS: kokoro (local, free)
Both lazy-loaded to avoid import overhead.
"""
import logging
import io
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)


class VoiceHandler:
    """Handles STT (speech-to-text) and TTS (text-to-speech) locally."""

    def __init__(self):
        self._whisper_model = None
        self._kokoro_pipeline = None

    def _get_whisper(self):
        """Lazy load Whisper model."""
        if self._whisper_model is None:
            try:
                from faster_whisper import WhisperModel
                self._whisper_model = WhisperModel(
                    "base",
                    device="cpu",
                    compute_type="int8",
                )
            except ImportError:
                logger.warning("faster-whisper not available, STT disabled")
        return self._whisper_model

    def _get_kokoro(self):
        """Lazy load Kokoro TTS pipeline."""
        if self._kokoro_pipeline is None:
            try:
                from kokoro import KPipeline
                self._kokoro_pipeline = KPipeline(lang_code="a")
            except ImportError:
                logger.warning("Kokoro not available, TTS disabled")
        return self._kokoro_pipeline

    async def transcribe(self, audio_bytes: bytes) -> str:
        """Convert audio bytes to text using Whisper."""
        model = self._get_whisper()
        if model is None:
            return ""

        def _transcribe_sync():
            audio_io = io.BytesIO(audio_bytes)
            segments, _ = model.transcribe(audio_io, language="en")
            return " ".join(s.text for s in segments).strip()

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _transcribe_sync)

    async def synthesize(self, text: str) -> Optional[bytes]:
        """Convert text to speech audio bytes (WAV format)."""
        pipeline = self._get_kokoro()
        if pipeline is None:
            return None

        def _synthesize_sync():
            try:
                import soundfile as sf
                import numpy as np

                audio_chunks = []
                for _, _, audio in pipeline(text, voice="af_heart", speed=1.0):
                    if audio is not None:
                        audio_chunks.append(audio)

                if not audio_chunks:
                    return None

                combined = np.concatenate(audio_chunks)
                buf = io.BytesIO()
                sf.write(buf, combined, 24000, format="WAV")
                return buf.getvalue()
            except Exception as e:
                logger.error(f"TTS synthesis failed: {e}")
                return None

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _synthesize_sync)


_voice_handler: Optional[VoiceHandler] = None


def get_voice_handler() -> VoiceHandler:
    global _voice_handler
    if _voice_handler is None:
        _voice_handler = VoiceHandler()
    return _voice_handler
