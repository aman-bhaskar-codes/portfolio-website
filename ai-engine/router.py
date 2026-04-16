
from classifier import classify_intent
from rag import retrieve_chunks
from speculative import speculative_generate
from models import generate_base
import time
import logging

logger = logging.getLogger("ai-engine")

async def process_query(query: str, session: dict) -> dict:
    """
    Central Intelligence Director.
    Routes queries to the optimal execution path.
    """
    start_time = time.time()
    
    # 1. Intent Classification (Fast)
    intent = classify_intent(query)
    logger.info(f"Intent classified as: {intent}")

    response = ""
    source = "base"

    # 2. Routing Logic
    if intent == "portfolio":
        logger.info("Routing to RAG (Strict)")
        context = await retrieve_chunks(query, top_k=5)
        response = await speculative_generate(query, context)
        source = "rag"

    elif intent == "general":
        logger.info("Routing to Base Model (Fast)")
        response = await speculative_generate(query, None)
        source = "base"

    elif intent == "hybrid":
        logger.info("Routing to Hybrid (RAG + Reasoning)")
        context = await retrieve_chunks(query, top_k=3)
        response = await speculative_generate(query, context)
        source = "hybrid"

    elif intent == "chitchat":
        response = await generate_base(query, system_prompt="You are a friendly dashboard assistant.")
        source = "base"
        
    else: # low_value
        response = "Please clarify your request."
        source = "filter"

    latency = int((time.time() - start_time) * 1000)

    return {
        "content": response,
        "source": source,
        "intent": intent,
        "latency": latency
    }
