import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from sqlalchemy.ext.asyncio import AsyncSession

from backend.ingestion.chunker import chunk_text
from backend.ingestion.cleaner import clean_text
from backend.ingestion.embed_store import store_chunks

visited = set()

async def crawl(db: AsyncSession, url: str, base: str):
    if url in visited:
        return

    visited.add(url)

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(url, timeout=10.0)
            
        soup = BeautifulSoup(r.text, "html.parser")
        text = clean_text(soup.get_text())
        chunks = chunk_text(text)

        await store_chunks(
            db=db,
            chunks=chunks,
            category="website",
            title=url,
            source=url,
            subcategory=None
        )

        for a in soup.find_all("a"):
            href = a.get("href")
            if not href:
                continue

            link = urljoin(base, href)
            
            # Recurse only on the exact base domain to avoid leaping externally
            if link.startswith(base):
                await crawl(db, link, base)

    except Exception as e:
        print(f"Error crawling {url}: {e}")

async def process_website(db: AsyncSession, base_url: str):
    visited.clear()
    await crawl(db, base_url, base_url)
