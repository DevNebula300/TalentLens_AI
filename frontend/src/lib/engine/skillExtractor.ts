import { SKILL_ALIASES } from "./skillAliases";

const _VOCABULARY = new Set<string>(Object.values(SKILL_ALIASES));
for (const alias of Object.keys(SKILL_ALIASES)) {
  _VOCABULARY.add(alias);
}

const _EXTRA_SKILLS = [
  "python",
  "java",
  "c++",
  "c#",
  "ruby",
  "php",
  "go",
  "rust",
  "swift",
  "kotlin",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "redis",
  "elasticsearch",
  "kafka",
  "rabbitmq",
  "linux",
  "unix",
  "bash",
  "shell",
  "git",
  "github",
  "gitlab",
  "bitbucket",
  "jira",
  "confluence",
  "scrum",
  "agile",
  "react",
  "angular",
  "vue",
  "node",
  "express",
  "django",
  "flask",
  "fastapi",
  "spring",
  "tensorflow",
  "pytorch",
  "keras",
  "scikit-learn",
  "pandas",
  "numpy",
  "matplotlib",
  "machine learning",
  "deep learning",
  "natural language processing",
  "computer vision",
  "data science",
  "data engineering",
  "data analysis",
  "data visualization",
  "devops",
  "ci/cd",
  "continuous integration",
  "continuous deployment",
  "rest",
  "graphql",
  "grpc",
  "microservices",
  "serverless",
  "cloud computing",
];

for (const skill of _EXTRA_SKILLS) {
  _VOCABULARY.add(skill);
}

const _SORTED_SKILLS = Array.from(_VOCABULARY).sort(
  (a, b) => b.length - a.length
);

/** Match Python str.title() */
function pyTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[^a-zA-Z])([a-z])/g, (_m, a, b) => a + b.toUpperCase());
}

/**
 * Extract a list of skills from unstructured text using keyword matching.
 * Optionally, ignores URLs unless the extracted skill is in allowedFromUrls.
 */
export function extractSkillsFromText(
  text: string,
  allowedFromUrls: string[] | null = null
): string[] {
  if (!text) {
    return [];
  }

  let textLower = text.toLowerCase();

  // strip URLs to prevent accidental skill extraction
  let textWithoutUrls = textLower.replace(
    /https?:\/\/\S+|www\.\S+|\S+\.com\/\S+/g,
    ""
  );

  const foundSkills = new Set<string>();
  const allowedLower = (allowedFromUrls || []).map((s) => s.toLowerCase());

  for (const skill of _SORTED_SKILLS) {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const prefix = /[a-zA-Z0-9]/.test(skill[0]) ? "\\b" : "";
    const suffix = /[a-zA-Z0-9]/.test(skill[skill.length - 1]) ? "\\b" : "";

    const patternSrc = `${prefix}${escapedSkill}${suffix}`;
    const testPattern = new RegExp(patternSrc, "i");

    const searchText = allowedLower.includes(skill.toLowerCase())
      ? textLower
      : textWithoutUrls;

    if (testPattern.test(searchText)) {
      const standardName = SKILL_ALIASES[skill] ?? skill;
      let formattedName: string;
      if (standardName.toLowerCase() === "sql") {
        formattedName = "SQL";
      } else if (standardName.toLowerCase() === "aws") {
        formattedName = "AWS";
      } else if (standardName.toLowerCase() === "api") {
        formattedName = "API";
      } else {
        formattedName =
          standardName.length > 3
            ? pyTitle(standardName)
            : standardName.toUpperCase();
      }

      foundSkills.add(formattedName);

      // avoid duplicate matches for sub words (replace all, like re.sub)
      textLower = textLower.replace(new RegExp(patternSrc, "gi"), " ");
      textWithoutUrls = textWithoutUrls.replace(
        new RegExp(patternSrc, "gi"),
        " "
      );
    }
  }

  return Array.from(foundSkills);
}

/**
 * Attempts to separate text into 'must-have' and 'preferred' sections,
 * then extracts skills from each.
 */
export function extractCategorizedSkills(text: string): {
  must_have: string[];
  preferred: string[];
} {
  let mustHaveText = text;
  let preferredText = "";

  const lowerText = text.toLowerCase();
  const splitKeywords = [
    "preferred qualifications",
    "nice to have",
    "nice-to-have",
    "bonus points for",
    "bonus skills",
    "preferred skills",
    "plus:",
  ];

  let splitIdx = -1;
  for (const keyword of splitKeywords) {
    const idx = lowerText.indexOf(keyword);
    if (idx !== -1) {
      if (splitIdx === -1 || idx < splitIdx) {
        splitIdx = idx;
      }
    }
  }

  if (splitIdx !== -1) {
    mustHaveText = text.slice(0, splitIdx);
    preferredText = text.slice(splitIdx);
  }

  const mustHaveSkills = extractSkillsFromText(mustHaveText);
  let preferredSkills = extractSkillsFromText(preferredText);

  preferredSkills = preferredSkills.filter((s) => !mustHaveSkills.includes(s));

  return {
    must_have: mustHaveSkills,
    preferred: preferredSkills,
  };
}
