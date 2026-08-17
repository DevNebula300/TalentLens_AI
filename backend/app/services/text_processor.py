import re


def clean_text(text: str) -> str:
    # normalize line endingins
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # excessive spaces remover
    text = re.sub(r"[ \t]+", " ", text)

    # excessive blank lines remover
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()