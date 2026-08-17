import fitz


def extract_text_from_pdf(file_path: str) -> str:
    full_text = ""

    with fitz.open(file_path) as document:
        for page in document:
            full_text += page.get_text()
            full_text += "\n"

    return full_text