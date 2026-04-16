import httpx
from typing import List
from backend.config.settings import settings

class Embedder:
    """World-class embedder using Ollama's local embedding models."""
    def __init__(self, model: str = settings.EMBED_MODEL, base_url: str = settings.OLLAMA_URL):
        self.model = model
        self.base_url = base_url

    async def embed_query(self, text: str) -> List[float]:
        """Embed a single query string for retrieval."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/embeddings",
                json={"model": self.model, "prompt": text},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["embedding"]
            
    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple documents for ingestion."""
        embeddings = []
        for text in texts:
            emb = await self.embed_query(text)
            embeddings.append(emb)
        return embeddings

embedder = Embedder()
