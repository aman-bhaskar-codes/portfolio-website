import asyncio
import json

# Session Context (Assuming Redis manager handles this natively via history)
from backend.session.session_manager import get_history, save_history

# V3 Layer Imports
from backend.perception.classifier import classify
from backend.perception.complexity import is_complex
from backend.knowledge.rag_engine import retrieve
from backend.knowledge.confidence import evaluate_confidence
from backend.cognition.router import route
from backend.cognition.strategy import respond
from backend.context.fusion import fuse
from backend.learning.reflection import reflect
from backend.learning.updater import update

# Voice (kept for audio pass)
from backend.perception.emotion import detect_emotion
from backend.preferences.profile import update_profile
from backend.cognition.depth import decide_depth
from backend.cognition.self_check import self_check

from backend.preferences.profile import get_user_profile, update_interaction, adaptive_prompt
from backend.reasoning.hidden_thinker import think_step
from datetime import datetime

async def cognitive_chat(db, user_id: str, query: str, mode: str, conversation_id: str = None):
    """
    Cognitive AI Orchestration V3 Main Engine + Enterprise Overhaul
    5 Layers: Perception -> Knowledge -> Decision -> Generation -> Learning
    """
    # Create or track conversation via UUID passed down from NextJS
    if conversation_id:
        conversation = await db.conversation.upsert(
            where={"id": conversation_id},
            data={
                "create": {"id": conversation_id, "userId": user_id, "source": mode},
                "update": {}
            }
        )
    
    # 0. Session & Profiling Layer
    profile = await get_user_profile(user_id) if user_id else None
    history = get_history(user_id) # Falls back to session cookie ID if not auth'd
    
    # 1. Perception Layer (Intent, Complexity, Emotion)
    category = await classify(query)
    emotion = detect_emotion(query)
    
    # Build Tone Modifier based on Emotion
    emotion_modifier = ""
    if emotion == "frustrated":
        emotion_modifier = "Be supportive, calm, and highly structured. "
    elif emotion == "excited":
        emotion_modifier = "Match excitement positively. "
    elif emotion == "confused":
        emotion_modifier = "Explain very clearly, step-by-step. "
        
    profile_modifier = adaptive_prompt(profile)
    
    tone_modifier = profile_modifier + "\\n" + emotion_modifier
    
    # Adaptive Depth Routing
    depth_mode = decide_depth(query)
    complex_flag = True if depth_mode == "deep" else False
    
    # 2. Knowledge Layer (Confidence Based RAG)
    rag_rows, conf = await retrieve(db, query)
    rag_level = evaluate_confidence(conf)
    
    # 3. Decision Layer (Smart Fusion)
    strategy = route(category, rag_level, complex_flag)
    
    # Build Context & fuse tone modifiers
    context = fuse(rag_rows, [], {}, [], history)
    if tone_modifier.strip():
        context = f"### ADAPTIVE_TONE & CONSTRAINTS:\n{tone_modifier}\n\n" + context

    # 4. Reason & Generate Layer
    full_response = ""
    
    # If complex, run the safe hidden CoT thinker
    if complex_flag:
        yield json.dumps({"chunk": "[Thinking deeply about this...]\\n\\n"}) + "\\n"
        full_response = await think_step(query, context)
        # We don't stream the internal CoT, we just yield the final block
        yield json.dumps({"chunk": full_response}) + "\\n"
    else:
        # Standard fast streaming
        async for chunk in respond(strategy, query, context):
            try:
                chunk_data = json.loads(chunk)
                text_chunk = chunk_data.get("chunk", "")
                full_response += text_chunk
                yield chunk
            except:
                yield chunk

    # Save to history & Log Action
    if conversation_id:
        await db.message.create(data={
            "conversationId": conversation_id,
            "role": "user",
            "content": query
        })
        await db.message.create(data={
            "conversationId": conversation_id,
            "role": "assistant",
            "content": full_response
        })
        
    await update_interaction(user_id)
    save_history(user_id, history + f"\\n\\nUser: {query}\\nAssistant: {full_response}")
    
    if user_id:
        await db.userlog.create(data={
            "userId": user_id,
            "action": "cognitive_query",
            "metadata": json.dumps({"strategy": strategy, "ragHit": len(rag_rows) > 0})
        })

    # 5. Learning Layer (Reflection & Reward)
    async def meta_learning_background():
        score = await reflect(query, full_response)
        update(user_id, query, full_response, score)
        
    asyncio.create_task(meta_learning_background())
