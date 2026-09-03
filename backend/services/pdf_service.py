import pymupdf as fitz
import re
from typing import List, Dict, Any

class PDFService:
    @staticmethod
    def extract_text_with_pages(file_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF preserving page numbers and basic structure.
        """
        doc = fitz.open(file_path)
        pages_data = []
        
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            text = page.get_text("text").strip()
            
            # Clean excessive whitespace while keeping paragraph breaks
            cleaned_text = re.sub(r'[ \t]+', ' ', text)
            cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
            
            if cleaned_text:
                pages_data.append({
                    "page_number": page_num,
                    "text": cleaned_text,
                    "word_count": len(cleaned_text.split())
                })
                
        doc.close()
        return pages_data

    @staticmethod
    def chunk_document(pages_data: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 80) -> List[Dict[str, Any]]:
        """
        Split page texts into manageable chunks while retaining page references.
        """
        chunks = []
        chunk_id = 1
        
        for page_item in pages_data:
            page_num = page_item["page_number"]
            text = page_item["text"]
            words = text.split()
            
            if not words:
                continue
                
            if len(words) <= chunk_size:
                chunks.append({
                    "chunk_id": f"chunk_{chunk_id}",
                    "page_number": page_num,
                    "text": text,
                    "snippet": text[:120] + "..." if len(text) > 120 else text
                })
                chunk_id += 1
            else:
                start = 0
                while start < len(words):
                    end = min(start + chunk_size, len(words))
                    chunk_text = " ".join(words[start:end])
                    chunks.append({
                        "chunk_id": f"chunk_{chunk_id}",
                        "page_number": page_num,
                        "text": chunk_text,
                        "snippet": chunk_text[:120] + "..." if len(chunk_text) > 120 else chunk_text
                    })
                    chunk_id += 1
                    if end == len(words):
                        break
                    start += (chunk_size - overlap)
                    
        return chunks
