from typing import List

class RecursiveCharacterChunker:
    """Intelligently splits long text into embeddable chunks while preserving semantic continuity."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
    def chunk_text(self, text: str) -> List[str]:
        """Splits text relying on character overlaps. 
        In production, this could be upgraded to LangChain's RecursiveCharacterTextSplitter."""
        if not text:
            return []
            
        chunks = []
        i = 0
        while i < len(text):
            chunk = text[i:i + self.chunk_size]
            chunks.append(chunk)
            # Advance ptr by size minus overlap
            i += self.chunk_size - self.chunk_overlap
            
        return chunks

chunker = RecursiveCharacterChunker()
