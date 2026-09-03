import re
import math
from typing import List, Dict, Any

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    HAS_SKLEARN = True
except Exception:
    HAS_SKLEARN = False

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
            # For lecture-size docs keep full vision, but if query is specific, rank with vector for better citations
            # Use vector ranking to reorder, but still return all for completeness (citations will be top)
            if HAS_SKLEARN and len(chunks) > 5:
                try:
                    return cls._vector_rank(query, chunks, top_k=len(chunks))
                except Exception:
                    return chunks
            return chunks

        # Large docs: vector TF-IDF cosine ranking (primary)
        if HAS_SKLEARN:
            try:
                ranked = cls._vector_rank(query, chunks, top_k=top_k)
                # If vector found meaningful scores, return
                if ranked and any(c.get("score", 0) > 0.05 for c in ranked):
                    return ranked
            except Exception:
                pass

        # Fallback keyword scoring
        norm_query = cls.normalize_text(query)
        query_tokens = [w for w in norm_query.split() if len(w) > 1]
        
        query_bigrams = [
            f"{query_tokens[i]} {query_tokens[i+1]}" 
            for i in range(len(query_tokens) - 1)
        ] if len(query_tokens) > 1 else []

        scored_chunks = []
        for c in chunks:
            raw_text = c.get("text", "")
            norm_chunk = cls.normalize_text(raw_text)
            chunk_tokens = set(norm_chunk.split())
            word_matches = sum(1 for w in query_tokens if w in chunk_tokens or w in norm_chunk)
            bigram_matches = sum(3 for bg in query_bigrams if bg in norm_chunk)
            exact_bonus = 5 if norm_query and norm_query in norm_chunk else 0
            total_score = (word_matches * 2) + bigram_matches + exact_bonus
            scored_chunks.append({**c, "score": total_score, "matched": total_score > 0})

        scored_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)
        top_scored = [c for c in scored_chunks if c.get("score", 0) > 0]

        if len(top_scored) >= top_k:
            return top_scored[:top_k]
        elif top_scored:
            existing_ids = {id(c) for c in top_scored}
            remaining = [c for c in chunks if id(c) not in existing_ids]
            step = max(1, len(remaining) // max(1, (top_k - len(top_scored))))
            supplement = remaining[::step]
            return (top_scored + supplement)[:top_k]

        step = max(1, len(chunks) // top_k)
        return chunks[::step][:top_k]

    @classmethod
    def _vector_rank(cls, query: str, chunks: List[Dict[str, Any]], top_k: int = 10) -> List[Dict[str, Any]]:
        """TF-IDF cosine similarity ranking with Arabic normalization."""
        norm_query = cls.normalize_text(query)
        if not norm_query:
            return chunks[:top_k]
        corpus = [cls.normalize_text(c.get("text", "")) for c in chunks]
        # Add query as last document for vectorizer
        vectorizer = TfidfVectorizer(ngram_range=(1,2), max_features=8000, sublinear_tf=True)
        try:
            tfidf = vectorizer.fit_transform(corpus + [norm_query])
        except ValueError:
            return chunks[:top_k]
        query_vec = tfidf[-1]
        chunk_vecs = tfidf[:-1]
        sims = cosine_similarity(query_vec, chunk_vecs).flatten()
        scored = []
        for idx, c in enumerate(chunks):
            scored.append({**c, "score": float(sims[idx]), "matched": float(sims[idx]) > 0.05})
        scored.sort(key=lambda x: x["score"], reverse=True)
        # If top scores are too low, fallback to keyword will handle, but return ranked anyway
        return scored[:top_k] if top_k < len(scored) else scored
