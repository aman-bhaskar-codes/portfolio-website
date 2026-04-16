import os
from backend.ingestion.identity_loader import load_identity
from backend.ingestion.website_loader import process_website
from backend.ingestion.github_loader import load_repo
from backend.db.session import AsyncSessionLocal

async def full_ingest():

    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Touch empty files if they don't exist to prevent crash
    for f in ["identity.txt", "governance.txt"]:
        path = os.path.join(data_dir, f)
        if not os.path.exists(path):
            with open(path, "w") as fp:
                fp.write(f"Placeholder for {f}")

    # identity
    await load_identity(os.path.join(data_dir, "identity.txt"), "identity")

    # governance
    await load_identity(os.path.join(data_dir, "governance.txt"), "governance")

    # website
    try:
        async with AsyncSessionLocal() as db:
            await process_website(db, "http://localhost:3000")
    except Exception as e:
        print(f"Skipping website crawl (site may be down): {e}")

    # github
    try:
        await load_repo("aman-bhaskar-codes", "RepoMind")
    except Exception as e:
        print(f"Skipping github repo (limits/network): {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(full_ingest())
