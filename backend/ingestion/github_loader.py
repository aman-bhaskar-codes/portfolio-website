import httpx

from backend.ingestion.chunker import chunk_text
from backend.ingestion.cleaner import clean_text
from backend.ingestion.embed_store import store_chunks


async def load_repo(owner, repo):

    url = f"https://api.github.com/repos/{owner}/{repo}"

    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=10.0)
        
    data = r.json()

    text = f"""
    Name: {data.get("name", "")}
    Description: {data.get("description", "")}
    Language: {data.get("language", "")}
    URL: {data.get("html_url", "")}
    """
    
    text = clean_text(text)

    chunks = chunk_text(text)

    await store_chunks(
        chunks,
        category="project",
        title=repo,
        source="github",
    )
