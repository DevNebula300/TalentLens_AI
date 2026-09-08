const SECTION_HEADING_KEYWORDS = new Set([
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
]);

const ALIAS_TO_SECTION: Record<string, string> = {
  summary: "Summary",
  "professional summary": "Summary",
  profile: "Summary",
  about: "Summary",
  "about me": "Summary",
  objective: "Summary",
  "career objective": "Summary",

  experience: "Experience",
  employment: "Experience",
  "work experience": "Experience",
  "professional experience": "Experience",
  history: "Experience",
  "employment history": "Experience",
  "work history": "Experience",

  education: "Education",
  "academic background": "Education",
  "academic history": "Education",
  "educational background": "Education",

  skills: "Skills",
  "key skills": "Skills",
  "technical skills": "Skills",
  "core skills": "Skills",
  "core competencies": "Skills",
  "skills technologies": "Skills",

  projects: "Projects",
  "personal projects": "Projects",
  "academic projects": "Projects",

  certifications: "Certifications",
  certificates: "Certifications",
  licenses: "Certifications",

  achievements: "Achievements",
  awards: "Achievements",
  honors: "Achievements",

  publications: "Publications",
  languages: "Languages",
  interests: "Interests",
  hobbies: "Interests",

  volunteer: "Volunteer",
  "volunteer experience": "Volunteer",

  references: "References",
  training: "Training",
  coursework: "Education",

  "personal details": "Personal Details",
  "personal information": "Personal Details",
  declaration: "Declaration",
};

/** Normalize a heading string by removing special characters and lowercasing. */
export function normalizeHeading(heading: string): string {
  return heading.replace(/[^a-zA-Z0-9\s]/g, "").toLowerCase().trim();
}

/** Return true when a line is likely to be a CV section heading. */
export function isHeading(line: string): boolean {
  const stripped = line.trim();

  if (!stripped) {
    return false;
  }

  if (stripped.length > 80) {
    return false;
  }

  if (
    stripped.startsWith("-") ||
    stripped.startsWith("•") ||
    stripped.startsWith("*") ||
    stripped.startsWith("▪") ||
    stripped.startsWith("→")
  ) {
    return false;
  }

  if (/https?:\/\/|www\.|@/i.test(stripped)) {
    return false;
  }

  if (
    /\b(?:19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/i.test(
      stripped
    )
  ) {
    return false;
  }

  const words = stripped.split(/\s+/);

  if (words.length > 10) {
    return false;
  }

  if (/[.!?]\s*$/.test(stripped)) {
    return false;
  }

  const normalized = normalizeHeading(stripped);
  if (normalized in ALIAS_TO_SECTION) {
    return true;
  }

  const keywordMatches = new Set(
    words
      .map((word) => word.replace(/^[&/,():\-]+|[&/,():\-]+$/g, "").toLowerCase())
      .filter((word) => SECTION_HEADING_KEYWORDS.has(word))
  );

  if (keywordMatches.size > 0 && words.length <= 6) {
    return true;
  }

  return false;
}

/**
 * Parses unstructured resume text into a dictionary of categorized sections
 * (e.g., Experience, Education, Skills).
 */
export function detectSections(text: string): Record<string, string> {
  const sections: Record<string, string[]> = { Summary: [] };
  let currentSection = "Summary";

  for (const line of text.split("\n")) {
    if (isHeading(line)) {
      const normalized = normalizeHeading(line);
      if (normalized in ALIAS_TO_SECTION) {
        currentSection = ALIAS_TO_SECTION[normalized];
      } else {
        const words = line.trim().split(/\s+/);
        const keywordMatches = [
          ...new Set(
            words
              .map((word) =>
                word.replace(/^[&/,():\-]+|[&/,():\-]+$/g, "").toLowerCase()
              )
              .filter((word) => SECTION_HEADING_KEYWORDS.has(word))
          ),
        ];
        if (keywordMatches.length > 0) {
          const first = keywordMatches[0];
          currentSection =
            first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        } else {
          // Match Python str.title()
          currentSection = line
            .trim()
            .toLowerCase()
            .replace(/(^|[^a-zA-Z])([a-z])/g, (_m, a, b) => a + b.toUpperCase());
        }
      }

      if (!(currentSection in sections)) {
        sections[currentSection] = [];
      }
    } else {
      sections[currentSection].push(line);
    }
  }

  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(sections)) {
    const joined = v.join("\n").trim();
    if (joined) {
      result[k] = joined;
    }
  }
  return result;
}
