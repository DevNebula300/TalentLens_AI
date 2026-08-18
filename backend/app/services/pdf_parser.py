# pyrefly: ignore [missing-import]
import fitz

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from a given PDF file using PyMuPDF (fitz).
    
    Args:
        file_path (str): The absolute or relative path to the PDF file.
        
    Returns:
        str: The fully extracted text from all pages of the PDF, separated by newlines.
    """
    full_text = ""

    # Open the PDF document from the given file path
    with fitz.open(file_path) as document:
        # Iterate through each page and append its extracted text
        for page in document:
            full_text += page.get_text()
            full_text += "\n"

    return full_text