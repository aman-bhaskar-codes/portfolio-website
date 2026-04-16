
import httpx
import logging
import json
import os

logger = logging.getLogger("ai-engine")

# Configuration
# Pointing to Ollama (via Docker host networking)
VLLM_URL = os.getenv("OLLAMA_URL", "http://host.docker.internal:11434/v1/chat/completions")
# Supported Options: phi3:mini, gemma:2b, qwen2.5:3b, mistral:7b
MAIN_MODEL = os.getenv("MAIN_MODEL", "qwen2.5:3b")
DRAFT_MODEL = "qwen2.5:0.5b" # Assuming user pulls a small model for draft

async def draft_model_generate(prompt: str, max_tokens=6) -> str:
    """
    Quickly generates token hypothesis using small model.
    """
    try:
        async with httpx.AsyncClient(timeout=0.5) as client:
            response = await client.post(
                VLLM_URL,
                json={
                    "model": DRAFT_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": 0.3
                }
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"Draft model failed: {e}")
        return "" # Draft failure shouldn't stop flow

async def main_model_verify(prompt: str, draft_tokens: str) -> str:
    """
    Main model verifies draft tokens and continues generation.
    In a real logit-level implementation, this would send token IDs.
    Here we simulate verification by prompting with the draft guidance.
    """
    try:
        full_content = prompt + draft_tokens 
        # In this mock verification, we actually just ask the main model to continue
        # predicting from where we are. True Speculative Decoding requires 
        # access to logits which standard Chat APIs don't always expose cleanly 
        # without custom server logic.
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                VLLM_URL,
                json={
                    "model": MAIN_MODEL,
                    "messages": [{"role": "user", "content": full_content}],
                    "max_tokens": 10, # Verify short chunk
                    "temperature": 0.2
                }
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Main model failed: {e}")
        return "I am experiencing technical difficulties."

async def generate_base(query: str, system_prompt: str = "") -> str:
    """
    Standard generation fallback.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                VLLM_URL,
                json={
                    "model": MAIN_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    "max_tokens": 200,
                    "temperature": 0.7
                }
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Base generation failed: {e}")
        return "System Error."
