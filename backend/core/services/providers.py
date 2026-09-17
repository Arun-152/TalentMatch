from abc import ABC, abstractmethod
from typing import List

class BaseEmbeddingProvider(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        pass

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_explanation(self, context: str, query: str) -> str:
        pass

class StubbedProvider(BaseEmbeddingProvider, BaseLLMProvider):
    """
    A stubbed provider for demo and local development purposes.
    In a real production environment, this class would hold logic to call 
    OpenAI, Anthropic, or local HuggingFace endpoints.
    """
    
    def embed_text(self, text: str) -> List[float]:
        # TODO: Insert OpenAI (text-embedding-ada-002) or other provider call here
        # For stub purposes, return a dummy vector (length 3) based on text length
        # to simulate basic dimensionality for cosine similarity.
        val = len(text) % 10 / 10.0
        return [val, 0.5, 1.0 - val]
        
    def generate_explanation(self, context: str, query: str) -> str:
        # TODO: Insert LLM (GPT-4 / Claude) call here.
        # System prompt: "You are an expert technical recruiter..."
        # User prompt: "Context: {context}. Question: Why does the candidate match {query}?"
        
        return (
            f"**[STUBBED LLM RESPONSE]**\n"
            f"Based on the retrieved snippets, the candidate shows evidence of skills "
            f"relevant to the job requirements. (In production, a real LLM would synthesize "
            f"the context '{context[:50]}...' into a fluent explanation here)."
        )
