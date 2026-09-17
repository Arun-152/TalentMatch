import math
from typing import Dict, Any, List
from core.services.providers import StubbedProvider

class EmbeddingMatchService:
    """
    RAG-based Extension for Matching (Feature Toggled)
    
    Instead of exact string matching, this service:
    1. Chunks the resume text.
    2. Embeds the chunks and stores them (simulated locally).
    3. Retrieves relevant snippets for job requirements using cosine similarity.
    4. Generates an LLM explanation.
    """
    
    @staticmethod
    def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = math.sqrt(sum(a * a for a in vec1))
        norm_b = math.sqrt(sum(b * b for b in vec2))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    @staticmethod
    def compute_match(resume_text: str, resume_skills: list, job_text: str, job_skills: list) -> Dict[str, Any]:
        provider = StubbedProvider()
        
        # 1. Chunking
        # In a real app, use LangChain RecursiveCharacterTextSplitter
        chunks = [chunk.strip() for chunk in resume_text.split('\n\n') if chunk.strip()]
        if not chunks:
            chunks = [resume_text]
            
        # 2. Embedding & Storage
        # In production, push these to pgvector, Pinecone, or ChromaDB
        embedded_chunks = []
        for chunk in chunks:
            embedded_chunks.append({
                "text": chunk,
                "vector": provider.embed_text(chunk)
            })
            
        # 3. Retrieval
        # We embed the job requirements to find the best matching chunk
        job_vector = provider.embed_text(job_text)
        
        # Calculate cosine similarity for all chunks
        scored_chunks = []
        for item in embedded_chunks:
            score = EmbeddingMatchService._cosine_similarity(job_vector, item["vector"])
            scored_chunks.append((score, item["text"]))
            
        # Sort by similarity and get the top 2 snippets (context)
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_context = "\n".join([text for _, text in scored_chunks[:2]])
        
        # 4. Generation
        explanation = provider.generate_explanation(context=top_context, query="the job requirements")
        
        # 5. Fallback Scoring
        # We still use the deterministic scoring for the numeric value in this hybrid approach
        resume_set = set(resume_skills)
        job_set = set(job_skills)
        
        matched_skills = job_set.intersection(resume_set)
        missing_skills = job_set.difference(resume_set)
        score = (len(matched_skills) / len(job_set) * 100.0) if job_set else 100.0

        return {
            "matched_skills": sorted(list(matched_skills)),
            "missing_skills": sorted(list(missing_skills)),
            "compatibility_score": round(score, 2),
            "llm_explanation": explanation
        }
