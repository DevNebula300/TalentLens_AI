from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity



model = SentenceTransformer("all-MiniLM-L6-v2")


SKILL_ALIASES = {
    # data Science, ai & ml
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "llm": "large language models",
    "nn": "neural networks",
    "cnn": "convolutional neural networks",
    "rnn": "recurrent neural networks",
    "rl": "reinforcement learning",
    "genai": "generative ai",
    "ds": "data science",
    "da": "data analysis",
    "de": "data engineering",

    # web & frontend
    "js": "javascript",
    "ts": "typescript",
    "react": "reactjs",
    "react.js": "reactjs",
    "node": "nodejs",
    "node.js": "nodejs",
    "vue": "vuejs",
    "vue.js": "vuejs",
    "ng": "angular",
    "angularjs": "angular",
    "html": "hypertext markup language",
    "css": "cascading style sheets",
    "ui": "user interface",
    "ux": "user experience",
    "ui/ux": "user interface / user experience",
    "a11y": "accessibility",
    "i18n": "internationalization",
    "l10n": "localization",

    # cloud & devOps
    "k8s": "kubernetes",
    "aws": "amazon web services",
    "gcp": "google cloud",
    "google cloud platform": "google cloud",
    "azure": "microsoft azure",
    "ci": "continuous integration",
    "cd": "continuous deployment",
    "ci/cd": "continuous integration and continuous deployment",
    "cicd": "continuous integration and continuous deployment",
    "iac": "infrastructure as code",
    "vm": "virtual machine",
    "ecs": "elastic container service",
    "eks": "elastic kubernetes service",
    "s3": "simple storage service",
    
    # database & backend
    "db": "database",
    "dba": "database administration",
    "sql": "structured query language",
    "nosql": "not only sql",
    "rdbms": "relational database management system",
    "pg": "postgresql",
    "postgres": "postgresql",
    "mongo": "mongodb",
    "api": "application programming interface",
    "rest": "representational state transfer",
    "graphql": "gql",
    "gql": "graphql",
    
    # methodologies & general tools
    "agile": "agile methodology",
    "qa": "quality assurance",
    "tdd": "test driven development",
    "bdd": "behavior driven development",
    "oop": "object oriented programming",
    "fp": "functional programming",
    "os": "operating system",
    "vcs": "version control system",
    "mr": "merge request",

    # management & hr
    "pm": "project management",
    "pmp": "project management professional",
    "csm": "certified scrum master",
    "hr": "human resources",
    "b2b": "business to business",
    "b2c": "business to consumer",
    "crm": "customer relationship management",
    "erp": "enterprise resource planning",
    "mba": "master of business administration",
    "roi": "return on investment",
    "kpi": "key performance indicator",
    "okr": "objectives and key results",
    "coo": "chief operating officer",
    "ceo": "chief executive officer",
    "cfo": "chief financial officer",
    "cto": "chief technology officer",
    "cmo": "chief marketing officer",

    # finance & accounting
    "cpa": "certified public accountant",
    "cfa": "chartered financial analyst",
    "p&l": "profit and loss",
    "ap": "accounts payable",
    "ar": "accounts receivable",

    # healthcare & medical
    "cpr": "cardiopulmonary resuscitation",
    "rn": "registered nurse",
    "lpn": "licensed practical nurse",
    "md": "medical doctor",
    "emr": "electronic medical records",
    "ehr": "electronic health records",
    "hipaa": "health insurance portability and accountability act",

    # marketing & sales
    "sem": "search engine marketing",
    "seo": "search engine optimization",
    "smm": "social media marketing",
    "ppc": "pay per click",
    "cta": "call to action",
}

EQUIVALENT_THRESHOLD = 0.85
RELATED_THRESHOLD = 0.65


def normalize_skill(skill: str) -> str:
    """Normalize a skill by lowercasing and resolving common aliases."""
    normalized = skill.lower().strip()
    return SKILL_ALIASES.get(normalized, normalized)


def calculate_similarity(skill_a: str, skill_b: str) -> float:
    """
    Calculate similarity between two skills.
    First uses alias resolution, then falls back to SentenceTransformer.
    """
    norm_a = normalize_skill(skill_a)
    norm_b = normalize_skill(skill_b)

    if norm_a == norm_b:
        return 1.0

    embeddings = model.encode(
        [norm_a, norm_b],
        normalize_embeddings=True,
    )

    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]],
    )[0][0]

    return float(similarity)


def classify_similarity(similarity: float) -> str:
    """
    Classify similarity using two thresholds.

    >= 0.85  -> equivalent
    >= 0.65  -> related
    <  0.65  -> unknown
    """

    if similarity >= EQUIVALENT_THRESHOLD:
        return "equivalent"

    if similarity >= RELATED_THRESHOLD:
        return "related"

    return "unknown"


def classify_skill_pair(
    skill_a: str,
    skill_b: str,
) -> dict:
    """
    Compares two skills using NLP embeddings and classifies their relationship.
    
    This function computes the semantic cosine similarity between two skill strings
    and maps the score to a relationship classification (e.g., equivalent, related).
    
    Args:
        skill_a (str): The first skill to compare.
        skill_b (str): The second skill to compare.
        
    Returns:
        dict: A dictionary containing the original skills, the raw similarity score,
              and the text classification ("equivalent", "related", or "unknown").
              
    Raises:
        ValueError: If either skill string is empty or contains only whitespace.
    """

    if not skill_a.strip() or not skill_b.strip():
        raise ValueError("Skills cannot be empty.")

    similarity = calculate_similarity(
        skill_a,
        skill_b,
    )

    classification = classify_similarity(similarity)

    return {
        "skill_a": skill_a,
        "skill_b": skill_b,
        "similarity": round(similarity, 4),
        "classification": classification,
    }




    test_pairs = [
        ("ML", "Machine Learning"),
        ("Docker", "Kubernetes"),
        ("Python", "Accounting"),
    ]

    for skill_a, skill_b in test_pairs:
        result = classify_skill_pair(
            skill_a,
            skill_b,
        )

        print(result)