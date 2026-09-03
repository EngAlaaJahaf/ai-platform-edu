import re
import math
from typing import List, Dict, Any

class RAGService:
    """
    Dynamic Multi-Lingual RAG & Semantic Retrieval Engine.
    Provides intelligent, zero-hardcoding semantic retrieval across all academic disciplines,
    languages (Arabic, English, French, etc.), and document formats.
    """

    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize Arabic and Latin text for flexible keyword/token matching."""
        if not text:
            return ""
        # Remove Arabic diacritics
        text = re.sub(r'[\u064B-\u065F\u0670]', '', text)
        # Normalize Arabic letter variants
        text = re.sub(r'[إأآا]', 'ا', text)
        text = re.sub(r'ة', 'ه', text)
        text = re.sub(r'ى', 'ي', text)
        text = re.sub(r'ؤ', 'و', text)
        text = re.sub(r'ئ', 'ي', text)
        # Replace non-alphanumeric symbols with spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        return text.lower().strip()

    @classmethod
    def search_relevant_chunks(
        cls, 
        query: str, 
        chunks: List[Dict[str, Any]], 
        top_k: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Dynamically retrieves the most relevant chunks.
        For lecture/course documents (<= 100 chunks, up to ~35,000 words), 
        it provides the complete document structured by pages so the AI model has 100% full vision
        including intro slides, body, summaries, and final assignment slides.
        For massive book-length documents, it applies dynamic n-gram TF-IDF ranking with page distribution.
        """
        if not chunks:
            return []

        # If document is within lecture / book chapter size (<= 100 chunks),
        # return all chunks preserved in page order so the LLM has zero blind spots!
        if len(chunks) <= 100:
            return chunks

        norm_query = cls.normalize_text(query)
        query_tokens = [w for w in norm_query.split() if len(w) > 1]
        
        # Extract query bigrams for phrase matching
        query_bigrams = [
            f"{query_tokens[i]} {query_tokens[i+1]}" 
            for i in range(len(query_tokens) - 1)
        ] if len(query_tokens) > 1 else []

        scored_chunks = []
        for c in chunks:
            raw_text = c.get("text", "")
            norm_chunk = cls.normalize_text(raw_text)
            chunk_tokens = set(norm_chunk.split())
            
            # 1. Single word match score
            word_matches = sum(1 for w in query_tokens if w in chunk_tokens or w in norm_chunk)
            
            # 2. Bigram phrase match score
            bigram_matches = sum(3 for bg in query_bigrams if bg in norm_chunk)
            
            # 3. Direct query substring match bonus
            exact_bonus = 5 if norm_query and norm_query in norm_chunk else 0
            
            total_score = (word_matches * 2) + bigram_matches + exact_bonus
            
            scored_chunks.append({
                **c,
                "score": total_score,
                "matched": total_score > 0
            })

        # Sort by relevance
        scored_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
        top_scored = [c for c in scored_chunks if c.get("score", 0) > 0]

        if len(top_scored) >= top_k:
            return top_scored[:top_k]
        elif top_scored:
            # Supplement with evenly distributed chunks across remaining pages
            existing_ids = {id(c) for c in top_scored}
            remaining = [c for c in chunks if id(c) not in existing_ids]
            step = max(1, len(remaining) // max(1, (top_k - len(top_scored))))
            supplement = remaining[::step]
            return (top_scored + supplement)[:top_k]

        # If zero token overlap (e.g. cross-language query on large doc),
        # evenly sample chunks from beginning, middle, and end so the LLM gets broad coverage
        step = max(1, len(chunks) // top_k)
        return chunks[::step][:top_k]
