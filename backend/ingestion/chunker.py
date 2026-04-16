CHUNK_SIZE = 500
OVERLAP = 50


def chunk_text(text: str):

    chunks = []

    start = 0

    while start < len(text):

        end = start + CHUNK_SIZE

        chunk = text[start:end]

        chunks.append(chunk)

        start += CHUNK_SIZE - OVERLAP

    return chunks
