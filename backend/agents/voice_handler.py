"""
Voice Handler Agent Node — manages real-time STT → LLM → TTS pipeline.
Handles WebSocket voice sessions via FastAPI.

STT: Web Speech API (client-side) or faster-whisper (server-side)
TTS: edge-tts (reliable, low-latency) or Kokoro
"""

import logging
from typing import Optional

from backend.agents.state import AgentState
from backend.config.settings import settings

logger = logging.getLogger("portfolio.agents.voice_handler")


async def voice_handler_node(state: AgentState) -> AgentState:
    """
    LangGraph node: handle voice interaction requests.
    
    Note: Real voice streaming is handled at the WebSocket API layer.
    This node prepares the state for voice-mode responses:
        - Shorter, more conversational responses
        - Voice-friendly formatting (no markdown)
        - TTS preparation metadata
    
    Writes to state:
        - voice_mode: True
        - response modified for voice-friendly output
    """
    state["voice_mode"] = True
    
    # Voice responses should be shorter and more conversational
    state["deep_dive"] = False
    
    logger.info(f"Voice handler: session={state.get('session_id')}")
    return state


async def synthesize_speech(text: str, voice: str = "en-US-AriaNeural") -> Optional[bytes]:
    """
    Convert text to speech using edge-tts.
    
    Args:
        text: Text to convert to speech
        voice: edge-tts voice name
    
    Returns:
        Audio bytes (MP3) or None on failure
    """
    try:
        import edge_tts
        
        communicate = edge_tts.Communicate(text, voice)
        audio_chunks = []
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])
        
        if audio_chunks:
            return b"".join(audio_chunks)
        
    except ImportError:
        logger.warning("edge-tts not installed — TTS disabled")
    except Exception as e:
        logger.error(f"TTS synthesis error: {e}")
    
    return None


def strip_markdown_for_voice(text: str) -> str:
    """
    Strip markdown formatting to produce clean text for TTS.
    Removes code blocks, links, bold/italic markers, etc.
    """
    import re
    
    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    # Remove inline code
    text = re.sub(r'`[^`]+`', '', text)
    # Remove links, keep text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    # Remove bold/italic
    text = re.sub(r'\*+([^*]+)\*+', r'\1', text)
    # Remove headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove citation markers
    text = re.sub(r'\[from:\s*[^\]]+\]', '', text)
    # Clean up whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()
