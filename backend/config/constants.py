"""
Constants for the agentic portfolio system.
Model registry, intent mappings, and token budgets.
"""

# ═══════════════════════════════════════════════════════════
# MODEL REGISTRY — Three local Ollama models
# ═══════════════════════════════════════════════════════════

MODEL_REGISTRY = {
    "llama3.2:3b": {
        "name": "llama3.2:3b",
        "use_cases": ["router", "social_proof", "small_talk", "memory_compression"],
        "max_context": 3200,
        "speed": "fast",
        "description": "Fast conversational model for classification and light tasks",
    },
    "qwen2.5:3b": {
        "name": "qwen2.5:3b",
        "use_cases": ["code", "technical_skills", "demo_request"],
        "max_context": 3200,
        "speed": "medium",
        "description": "Code reasoning and technical question answering",
    },
    "phi4-mini": {
        "name": "phi4-mini",
        "use_cases": ["rag_synthesis", "deep_reasoning", "personal_info"],
        "max_context": 3200,
        "speed": "slow",
        "description": "Deeper reasoning, complex synthesis from retrieved context",
    },
}

# ═══════════════════════════════════════════════════════════
# INTENT → MODEL MAPPING
# ═══════════════════════════════════════════════════════════

INTENT_LABELS = [
    "personal_info",
    "projects",
    "technical_skills",
    "social_proof",
    "voice_interaction",
    "demo_request",
    "small_talk",
    "out_of_scope",
]

INTENT_TO_MODEL = {
    "personal_info": "phi4-mini",
    "projects": "phi4-mini",
    "technical_skills": "qwen2.5:3b",
    "social_proof": "llama3.2:3b",
    "voice_interaction": "llama3.2:3b",
    "demo_request": "qwen2.5:3b",
    "small_talk": "llama3.2:3b",
    "out_of_scope": "llama3.2:3b",
}

# Intents that trigger RAG retrieval
RAG_INTENTS = {"personal_info", "projects", "technical_skills"}

# Intents that trigger social data fetching
SOCIAL_INTENTS = {"social_proof"}

# Intents that trigger code agent
CODE_INTENTS = {"demo_request", "technical_skills"}

# ═══════════════════════════════════════════════════════════
# TOKEN BUDGETS
# ═══════════════════════════════════════════════════════════

TOKEN_BUDGET = {
    "system_prompt": 800,
    "retrieved_context": 1200,
    "conversation_history": 600,
    "user_message": 400,
    "response_default": 300,
    "response_deep_dive": 800,
    "total_max": 3200,
}

# ═══════════════════════════════════════════════════════════
# RAG CONFIGURATION
# ═══════════════════════════════════════════════════════════

RAG_CONFIG = {
    "chunk_size": 512,
    "chunk_overlap": 64,
    "dense_top_k": 20,
    "sparse_top_k": 20,
    "rerank_top_k": 5,
    "rrf_k": 60,  # RRF constant
    "diversity_same_source_limit": 2,  # Max chunks from same source in top-3
    "hyde_model": "llama3.2:3b",
    "reranker_model": "cross-encoder/ms-marco-MiniLM-L-6-v2",
}

# ═══════════════════════════════════════════════════════════
# MEMORY CONFIGURATION
# ═══════════════════════════════════════════════════════════

MEMORY_CONFIG = {
    "working_memory_max_turns": 10,
    "working_memory_max_bytes": 2048,
    "episodic_compression_interval": 10,  # Compress every N turns
    "semantic_update_interval_hours": 24,
    "anonymous_prune_days": 7,
}

# ═══════════════════════════════════════════════════════════
# RESPONSE PERSONA
# ═══════════════════════════════════════════════════════════

PERSONA = {
    "tone": "warm, direct, technically confident",
    "perspective": "first person as proxy for owner",
    "max_words_default": 280,
    "max_words_deep_dive": 800,
    "always_end_with": "follow-up question to keep engagement",
    "citation_format": "[from: {source_name}]",
    "uncertainty_response": "I don't have that info right now — check {relevant_link}",
}
