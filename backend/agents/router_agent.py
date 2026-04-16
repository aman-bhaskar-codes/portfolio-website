"""
Router Agent — classifies user intent and routes to specialist agents.
Uses llama3.2:3b for fast classification.
"""

import json
import logging

import httpx

from backend.agents.state import AgentState
from backend.config.settings import settings
from backend.config.constants import INTENT_LABELS, INTENT_TO_MODEL
from backend.prompts.factory import prompt_factory

logger = logging.getLogger("portfolio.agents.router")


async def router_agent_node(state: AgentState) -> AgentState:
    """
    LangGraph node: classify the user's intent.
    
    Writes to state:
        - intent: classified intent label
        - confidence: classification confidence
        - entities: extracted entities
        - model_used: which model should handle this intent
    """
    query = state["query"]
    
    # Build classification prompt
    prompt = prompt_factory.build_router_prompt(query)
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": "llama3.2:3b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,  # Low temperature for classification
                        "num_predict": 100,
                    },
                },
            )
            response.raise_for_status()
            raw_output = response.json().get("response", "").strip()
        
        # Parse structured output
        intent_data = _parse_intent(raw_output)
        
        state["intent"] = intent_data["intent"]
        state["confidence"] = intent_data["confidence"]
        state["entities"] = intent_data["entities"]
        state["model_used"] = state.get("model_override") or INTENT_TO_MODEL.get(
            intent_data["intent"], "llama3.2:3b"
        )
        
        logger.info(
            f"Router: intent={intent_data['intent']}, "
            f"confidence={intent_data['confidence']:.2f}, "
            f"model={state['model_used']}"
        )
        
    except Exception as e:
        logger.error(f"Router classification failed: {e}")
        # Fallback: default to small_talk with llama3.2:3b
        state["intent"] = "small_talk"
        state["confidence"] = 0.5
        state["entities"] = []
        state["model_used"] = state.get("model_override") or "llama3.2:3b"
    
    return state


def _parse_intent(raw: str) -> dict:
    """Parse the router's JSON output. Handles malformed responses gracefully."""
    # Try parsing as JSON
    try:
        # Sometimes the model wraps it in markdown
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        
        data = json.loads(cleaned)
        intent = data.get("intent", "small_talk")
        
        # Validate intent is in known labels
        if intent not in INTENT_LABELS:
            # Find closest match
            intent = _fuzzy_match_intent(intent)
        
        return {
            "intent": intent,
            "confidence": min(max(float(data.get("confidence", 0.7)), 0.0), 1.0),
            "entities": data.get("entities", []),
        }
        
    except (json.JSONDecodeError, KeyError, ValueError):
        pass
    
    # Fallback: keyword-based classification
    return _keyword_classify(raw)


def _fuzzy_match_intent(raw_intent: str) -> str:
    """Try to match a malformed intent to the closest valid one."""
    raw_lower = raw_intent.lower().strip()
    
    for label in INTENT_LABELS:
        if label in raw_lower or raw_lower in label:
            return label
    
    return "small_talk"


def _keyword_classify(text: str) -> dict:
    """Fallback keyword-based classification."""
    text_lower = text.lower()
    
    keyword_map = {
        "personal_info": ["who", "about", "background", "education", "bio", "yourself"],
        "projects": ["project", "portfolio", "built", "created", "work", "app"],
        "technical_skills": ["skill", "technology", "language", "framework", "stack", "code"],
        "social_proof": ["github", "linkedin", "instagram", "social", "stars", "contributions"],
        "demo_request": ["demo", "show", "example", "walkthrough", "explain code"],
        "small_talk": ["hello", "hi", "hey", "thanks", "bye", "how are"],
    }
    
    for intent, keywords in keyword_map.items():
        if any(kw in text_lower for kw in keywords):
            return {"intent": intent, "confidence": 0.6, "entities": []}
    
    return {"intent": "small_talk", "confidence": 0.5, "entities": []}
