function extractBullets(text: string): string[] {
  const bullets: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (
      line.startsWith("-") ||
      line.startsWith("*") ||
      line.startsWith("•") ||
      (line.length > 15 && !line.endsWith(":"))
    ) {
      const cleanLine = line.replace(/^[-*•]\s*/, "");
      if (cleanLine) bullets.push(cleanLine);
    }
  }
  return bullets;
}

function analyzeWeakBullets(
  sections: Record<string, string>,
): Array<[number, string]> {
  const weakRecommendations: Array<[number, string]> = [];
  const targetSections = [
    "Experience",
    "Projects",
    "Employment",
    "Work Experience",
    "Professional Experience",
  ];

  const bullets: string[] = [];
  for (const [secName, secText] of Object.entries(sections)) {
    if (targetSections.some((ts) => secName.toLowerCase().includes(ts.toLowerCase()))) {
      bullets.push(...extractBullets(secText));
    }
  }

  const weakVerbs = [
    "helped",
    "worked on",
    "responsible for",
    "assisted",
    "managed",
    "did",
    "was",
    "were",
    "handled",
  ];
  const metricsPattern =
    /\d+%|\$\d+|\b\d+\s*(?:users|clients|servers|months|years|days|hours)\b|\d+x/i;

  const weakVerbBullets: Array<[string, string]> = [];
  const noMetricsBullets: string[] = [];

  for (const bullet of bullets) {
    const words = bullet.split(/\s+/);
    if (words.length < 4) continue;

    const hasMetrics = metricsPattern.test(bullet);
    const hasNumber = /\d/.test(bullet);
    const lowerBullet = bullet.toLowerCase();
    const foundWeakVerb =
      weakVerbs.find(
        (v) => lowerBullet.startsWith(v) || lowerBullet.includes(` ${v} `),
      ) ?? null;

    const snippet =
      bullet.length > 100 ? `${bullet.slice(0, 100)}...` : bullet;

    if (foundWeakVerb && !hasNumber && weakVerbBullets.length < 2) {
      weakVerbBullets.push([snippet, foundWeakVerb]);
    } else if (
      !hasMetrics &&
      !hasNumber &&
      words.length > 8 &&
      noMetricsBullets.length < 2
    ) {
      noMetricsBullets.push(snippet);
    }
  }

  if (weakVerbBullets.length > 0) {
    if (weakVerbBullets.length === 1) {
      const [snippet, verb] = weakVerbBullets[0];
      weakRecommendations.push([
        1.8,
        `Improve the bullet: '${snippet}' by replacing '${verb}' with a stronger action verb and adding measurable impact.`,
      ]);
    } else {
      const snippetsText = weakVerbBullets.map((b) => `'${b[0]}'`).join(" | ");
      const verbs = [...new Set(weakVerbBullets.map((b) => b[1]))];
      const verbsStr = verbs.map((v) => `'${v}'`).join(", ");
      weakRecommendations.push([
        1.8,
        `Improve these bullets by replacing weak verbs (${verbsStr}) with stronger action verbs and adding measurable impact: ${snippetsText}.`,
      ]);
    }
  }

  if (noMetricsBullets.length > 0) {
    if (noMetricsBullets.length === 1) {
      weakRecommendations.push([
        1.4,
        `Quantify your impact in this bullet: '${noMetricsBullets[0]}'.`,
      ]);
    } else {
      const snippetsText = noMetricsBullets.map((b) => `'${b}'`).join(" | ");
      weakRecommendations.push([
        1.4,
        `Quantify your impact in these bullets: ${snippetsText}.`,
      ]);
    }
  }

  return weakRecommendations;
}

export function generateRecommendations(
  analysisData: Record<string, unknown>,
): string[] {
  const missing = (analysisData.missing_skills as string[]) || [];
  const matched = (analysisData.matched_skills as string[]) || [];
  const additional = (analysisData.additional_skills as string[]) || [];

  const skillScore = Number(analysisData.skill_score ?? 0);
  const experienceScore = Number(analysisData.experience_score ?? 0);
  const keywordScore = Number(analysisData.keyword_score ?? 0);
  const semanticScore = Number(analysisData.semantic_score ?? 0);
  const isOverqualified = Boolean(analysisData.overqualification_flag);
  const hasProjects = Boolean(analysisData.has_projects);
  const resumeSections =
    (analysisData.resume_sections as Record<string, string>) || {};
  const importanceDict =
    (analysisData.skill_importance as Record<string, number>) ||
    (analysisData.skill_frequency as Record<string, number>) ||
    {};

  const scoredRecommendations: Array<[number, string]> = [];
  const skillGap = Math.max(0, 1 - skillScore);
  const expGap = Math.max(0, 1 - experienceScore);
  const keywordGap = Math.max(0, 1 - keywordScore);

  if (Object.keys(resumeSections).length > 0) {
    scoredRecommendations.push(...analyzeWeakBullets(resumeSections));

    let skillsText = "";
    let expText = "";
    for (const [secName, text] of Object.entries(resumeSections)) {
      if (secName.toLowerCase().includes("skill")) {
        skillsText += `${text.toLowerCase()} `;
      } else if (
        ["experience", "employment", "work"].some((ts) =>
          secName.toLowerCase().includes(ts),
        )
      ) {
        expText += `${text.toLowerCase()} `;
      }
    }

    if (skillsText && expText) {
      for (const skill of matched.slice(0, 5)) {
        const skillLower = skill.toLowerCase();
        if (skillsText.includes(skillLower) && !expText.includes(skillLower)) {
          scoredRecommendations.push([
            1.6,
            `You listed '${skill}' in your Skills section, but it is not mentioned in your Experience section. Add bullet points detailing how you used this skill in practice.`,
          ]);
          break;
        }
      }
    }
  }

  if (missing.length > 0) {
    const topMissing = [...missing]
      .sort((a, b) => (importanceDict[b] ?? 0) - (importanceDict[a] ?? 0))
      .slice(0, 3);
    const msg =
      semanticScore >= 0.7
        ? `You show strong conceptual alignment with the role, but lack explicit mentions of: ${topMissing.join(", ")}. If you have used these specific technologies, add them directly to your experience bullets. If you haven't, consider building a quick project to bridge the gap.`
        : `Prioritize learning and gaining practical experience in these key missing requirements: ${topMissing.join(", ")}.`;
    scoredRecommendations.push([skillGap * 2.0 + 0.5, msg]);
  }

  if (keywordScore < 0.5 && semanticScore > 0.65) {
    scoredRecommendations.push([
      keywordGap * 1.5 + (semanticScore - 0.65),
      "Your background aligns well conceptually, but your resume's terminology differs from the job posting. Mirror exact keywords used in the job description to improve your automated match rate.",
    ]);
  }

  if (experienceScore < 0.7) {
    const msg = hasProjects
      ? "You fall short of the required formal years of experience, but your strong project portfolio helps offset this. Ensure your project descriptions clearly map to the required skills to maximize their impact."
      : "If you lack the required formal years of work experience, strongly emphasize relevant personal projects, open-source contributions, or academic work that demonstrate equivalent practical capabilities. Otherwise, restructure your experience section to more clearly surface aligned responsibilities.";
    scoredRecommendations.push([expGap * 1.5, msg]);
  }

  if (isOverqualified) {
    scoredRecommendations.push([
      1.2,
      "Your profile may appear overqualified. Consider emphasizing adaptability, mentorship, or scope-appropriate achievements rather than advanced technical depth alone.",
    ]);
  }

  if (additional.length > 0 && skillScore >= 0.7) {
    scoredRecommendations.push([
      0.4 + skillScore * 0.5,
      `You possess valuable extra skills (${additional.slice(0, 3).join(", ")}) not explicitly requested. Highlight how these uniquely position you to add value beyond the core requirements.`,
    ]);
  }

  if (skillScore >= 0.8 && experienceScore >= 0.75) {
    scoredRecommendations.push([
      (skillScore + experienceScore) / 2.0,
      "Your core qualifications align strongly. Focus on quantifying your impact (e.g., metrics, scale, outcomes) in your bullet points to stand out from other qualified candidates.",
    ]);
  }

  scoredRecommendations.sort((a, b) => b[0] - a[0]);
  const recommendations = scoredRecommendations.map(([, msg]) => msg);

  if (recommendations.length === 0) {
    recommendations.push(
      "Your resume is reasonably aligned with this role. Review the job description closely to ensure your most relevant experiences are featured prominently.",
    );
  }

  return recommendations.slice(0, 6);
}
