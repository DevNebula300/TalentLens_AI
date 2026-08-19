import re
from typing import List

from app.services.skill_similarity import SKILL_ALIASES


_VOCABULARY = set(SKILL_ALIASES.values())
for alias in SKILL_ALIASES.keys():
    _VOCABULARY.add(alias)
    
_EXTRA_SKILLS = {
    "python", "java", "c++", "c#", "ruby", "php", "go", "rust", "swift", "kotlin",
    "docker", "kubernetes", "aws", "azure", "gcp", "sql", "mysql", "postgresql", "mongodb",
    "redis", "elasticsearch", "kafka", "rabbitmq", "linux", "unix", "bash", "shell",
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "scrum", "agile",
    "react", "angular", "vue", "node", "express", "django", "flask", "fastapi", "spring",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "matplotlib",
    "machine learning", "deep learning", "natural language processing", "computer vision",
    "data science", "data engineering", "data analysis", "data visualization",
    "devops", "ci/cd", "continuous integration", "continuous deployment",
    "rest", "graphql", "grpc", "microservices", "serverless", "cloud computing",
    
    
}

_VOCABULARY.update(_EXTRA_SKILLS)


_SORTED_SKILLS = sorted(list(_VOCABULARY), key=len, reverse=True)

def extract_skills_from_text(text: str, allowed_from_urls: List[str] = None) -> List[str]:
    """
    Extract a list of skills from unstructured text using keyword matching.
    Optionally, ignores URLs unless the extracted skill is in allowed_from_urls.
    """
    if not text:
        return []
        
    text_lower = text.lower()
    
    # strip URLs to prevent accidental skill extraction
    text_without_urls = re.sub(r'https?://\S+|www\.\S+|\S+\.com/\S+', '', text_lower)
    
    found_skills = set()
    allowed_lower = [s.lower() for s in (allowed_from_urls or [])]
    
    for skill in _SORTED_SKILLS:

        escaped_skill = re.escape(skill)
        
        prefix = r'\b' if skill[0].isalnum() else r''
        suffix = r'\b' if skill[-1].isalnum() else r''
        
        pattern = f"{prefix}{escaped_skill}{suffix}"
        
        # if the skill is in allowed_from_urls
       
        search_text = text_lower if skill.lower() in allowed_lower else text_without_urls
        
        if re.search(pattern, search_text):
            standard_name = SKILL_ALIASES.get(skill, skill)
            if standard_name.lower() == "sql":
                formatted_name = "SQL"
            elif standard_name.lower() == "aws":
                formatted_name = "AWS"
            elif standard_name.lower() == "api":
                formatted_name = "API"
            else:
                formatted_name = standard_name.title() if len(standard_name) > 3 else standard_name.upper()
                
            found_skills.add(formatted_name)
            
            # avoid duplicate matches for sub words
            text_lower = re.sub(pattern, " ", text_lower)
            text_without_urls = re.sub(pattern, " ", text_without_urls)
            
    return list(found_skills)
