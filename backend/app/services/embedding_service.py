from sentence_transformers import SentenceTransformer


model = SentenceTransformer("all-MiniLM-L6-v2")

def generate_document_embedding(text: str) -> list[float]:
    """
    Generate an embedding for a document.
    Truncates text to model limits and generates a 384d embedding.
    """
    if not text or not text.strip():
        # Return a zero vector  if no text
        return [0.0] * 384
        
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()
