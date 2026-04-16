from sqlalchemy.ext.asyncio import AsyncSession
from backend.agents.planner_agent import PlannerAgent
from backend.rag.rag_service import rag_service

class Orchestrator:
    """The central brain router directing messages to the correct specialized sub-agent or RAG pipeline."""
    
    def __init__(self):
        self.planner = PlannerAgent()
        
    async def route_query(self, session: AsyncSession, query: str, force_agent: bool = False):
        # 1. Routing heuristic (If complex, use agents)
        if force_agent or "plan" in query.lower():
            plan = await self.planner.generate_plan(query)
            return {"type": "agent_plan", "data": plan}
            
        # 2. Default: Standard Fast RAG Pipeline
        context, nodes = await rag_service.retrieve_and_build_context(session, query)
        return {"type": "rag_context", "data": context}

orchestrator = Orchestrator()
