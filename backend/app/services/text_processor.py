import re


def clean_text(text: str) -> str:
    """
    Cleans and normalizes extracted text from documents.
    Removes excessive whitespace, standardizes line endings, and prepares text for NLP processing.
    
    Args:
        text (str): The raw extracted text.
        
    Returns:
        str: The cleaned, normalized text string.
    """
    # normalize line endings to standard Unix format (\n)
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # excessive spaces remover: collapse multiple spaces/tabs into a single space
    text = re.sub(r"[ \t]+", " ", text)

    # excessive blank lines remover: reduce 3+ consecutive newlines to exactly 2 newlines (paragraph break)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()
