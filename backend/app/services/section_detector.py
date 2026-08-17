import re

SECTION_HEADING_KEYWORDS = {
    "summary",
    "profile",
    "about",
    "objective",
    "experience",
    "employment",
    "education",
    "academic",
    "skills",
    "technical",
    "technologies",
    "projects",
    "certifications",
    "certificates",
    "achievements",
    "awards",
    "honors",
    "publications",
    "languages",
    "interests",
    "volunteer",
    "references",
    "training",
    "coursework",
    "details",
    "information",
    "declaration",
}

ALIAS_TO_SECTION = {
    "summary": "Summary",
    "professional summary": "Summary",
    "profile": "Summary",
    "about": "Summary",
    "about me": "Summary",
    "objective": "Summary",
    "career objective": "Summary",
    
    "experience": "Experience",
    "employment": "Experience",
    "work experience": "Experience",
    "professional experience": "Experience",
    "history": "Experience",
    "employment history": "Experience",
    "work history": "Experience",
    
    "education": "Education",
    "academic background": "Education",
    "academic history": "Education",
    "educational background": "Education",
    
    "skills": "Skills",
    "key skills": "Skills",
    "technical skills": "Skills",
    "core skills": "Skills",
    "core competencies": "Skills",
    "skills technologies": "Skills",
    
    "projects": "Projects",
    "personal projects": "Projects",
    "academic projects": "Projects",
    
    "certifications": "Certifications",
    "certificates": "Certifications",
    "licenses": "Certifications",
    
    "achievements": "Achievements",
    "awards": "Achievements",
    "honors": "Achievements",
    
    "publications": "Publications",
    "languages": "Languages",
    "interests": "Interests",
    "hobbies": "Interests",
    
    "volunteer": "Volunteer",
    "volunteer experience": "Volunteer",
    
    "references": "References",
    "training": "Training",
    "coursework": "Education",
    
    "personal details": "Personal Details",
    "personal information": "Personal Details",
    "declaration": "Declaration",
}

def normalize_heading(heading: str) -> str:
    """Normalize a heading string by removing special characters and lowercasing."""
    return re.sub(r"[^a-zA-Z0-9\s]", "", heading).lower().strip()

def is_heading(line: str) -> bool:
    """Return True when a line is likely to be a CV section heading."""
    stripped = line.strip()

    if not stripped:
        return False

    if len(stripped) > 80:
        return False

    if stripped.startswith(("-", "•", "*", "▪", "→")):
        return False

    if re.search(r"https?://|www\.|@", stripped, re.IGNORECASE):
        return False

    if re.search(
        r"\b(?:19|20)\d{2}\b"
        r"|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)"
        r"[a-z]*\.?\s+\d{4}\b",
        stripped,
        re.IGNORECASE,
    ):
        return False

    words = stripped.split()

    if len(words) > 10:
        return False
        
    if re.search(r"[.!?]\s*$", stripped):
        return False

    normalized = normalize_heading(stripped)
    if normalized in ALIAS_TO_SECTION:
        return True

    keyword_matches = {
        word.strip("&/,():-").lower()
        for word in words
    } & SECTION_HEADING_KEYWORDS

    if keyword_matches and len(words) <= 6:
        return True

    return False

def detect_sections(text: str) -> dict[str, str]:
    """Parse resume text into a dictionary of sections."""
    sections: dict[str, list[str]] = {"Summary": []}
    current_section = "Summary"
    
    for line in text.split("\n"):
        if is_heading(line):
            normalized = normalize_heading(line)
            if normalized in ALIAS_TO_SECTION:
                current_section = ALIAS_TO_SECTION[normalized]
            else:
                words = line.strip().split()
                keyword_matches = {word.strip("&/,():-").lower() for word in words} & SECTION_HEADING_KEYWORDS
                if keyword_matches:
                    current_section = list(keyword_matches)[0].capitalize()
                else:
                    current_section = line.strip().title()
            
            if current_section not in sections:
                sections[current_section] = []
        else:
            sections[current_section].append(line)
            
    return {k: "\n".join(v).strip() for k, v in sections.items() if "\n".join(v).strip()}