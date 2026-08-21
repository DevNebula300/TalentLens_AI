from sentence_transformers import SentenceTransformer
import numpy as np

# Use the same model as skill_similarity for consistency
model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_document_embedding(text: str) -> list[float]:
    """
    Generate an embedding for a document.
    Truncates text to model limits and generates a 384d embedding.
    """
    if not text or not text.strip():
        # Return a zero vector of 384 dimensions if no text
        return [0.0] * 384
        
    # The model handles tokenization and truncation internally.
    # By default, SentenceTransformer truncates at max_seq_length (256 for all-MiniLM-L6-v2)
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()
