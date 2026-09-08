import { classifySkillPair, calculateSimilarity } from "./skillSimilarity";
import { generateRecommendations } from "./recommendations";

type ExperienceLevels = Record<string, [number, number]>;

interface EngineConfig {
  static_weights: Record<string, number>;
  experience_levels: ExperienceLevels;
  dynamic_weight_factors: Record<string, number>;
  [key: string]: any;
}

export class ResumeMatchingEngine {
  static readonly STATIC_WEIGHTS: Record<string, number> = {
    semantic_match: 0.4,
    skill_match: 0.3,
    experience_match: 0.2,
    keyword_match: 0.1,
  };

  config: EngineConfig;

  constructor(config: Partial<EngineConfig> | null = null) {
    this.config = (config as EngineConfig) || {
      static_weights: { ...ResumeMatchingEngine.STATIC_WEIGHTS },
      experience_levels: {
        entry: [0, 2],
        junior: [2, 4],
        mid: [4, 7],
        senior: [7, 10],
        lead: [10, 15],
        principal: [15, Infinity],
      },
      dynamic_weight_factors: {
        skill_importance_threshold: 0.5,
        experience_importance_threshold: 5,
        keyword_density_threshold: 30,
      },
    };
  }

  calculateDynamicWeights(
    jobRequirements: Record<string, any>,
    jobDescription: string = ""
  ): Record<string, number> {
    const weights = { ...ResumeMatchingEngine.STATIC_WEIGHTS };

    const requiredSkills: string[] = jobRequirements.required_skills ?? [];
    const requiredYears: number = jobRequirements.required_years ?? 0;
    const keywords: string[] = jobRequirements.keywords ?? [];

    let adjustmentsMade = false;

    if (requiredSkills.length > 0) {
      const skillCount = requiredSkills.length;

      let skillBoost: number;
      if (skillCount >= 15) {
        skillBoost = 0.15;
      } else if (skillCount >= 10) {
        skillBoost = 0.1;
      } else if (skillCount >= 5) {
        skillBoost = 0.05;
      } else {
        skillBoost = -0.05;
      }

      const technicalSkills = [
        "python",
        "java",
        "javascript",
        "c++",
        "sql",
        "aws",
        "docker",
        "kubernetes",
        "react",
        "angular",
      ];
      const techCount = requiredSkills.filter((s) =>
        technicalSkills.some((tech) => s.toLowerCase().includes(tech))
      ).length;

      const techRatio = skillCount > 0 ? techCount / skillCount : 0;

      if (techRatio > 0.6) {
        skillBoost += 0.1;
        weights.semantic_match += 0.05;
        adjustmentsMade = true;
      }

      weights.skill_match += skillBoost;
      adjustmentsMade = true;
    }

    if (requiredYears > 0) {
      let expBoost: number;
      if (requiredYears >= 10) {
        expBoost = 0.15;
      } else if (requiredYears >= 7) {
        expBoost = 0.1;
      } else if (requiredYears >= 5) {
        expBoost = 0.05;
      } else if (requiredYears >= 3) {
        expBoost = 0.0;
      } else {
        expBoost = -0.05;
      }

      weights.experience_match += expBoost;

      const leadershipKeywords = [
        "lead",
        "senior",
        "director",
        "manager",
        "head",
        "principal",
        "staff",
      ];
      if (
        jobDescription &&
        leadershipKeywords.some((kw) =>
          jobDescription.toLowerCase().includes(kw)
        )
      ) {
        weights.experience_match += 0.05;
        adjustmentsMade = true;
      }

      adjustmentsMade = true;
    }

    if (keywords.length > 0) {
      const keywordCount = keywords.length;

      let keywordBoost: number;
      if (keywordCount >= 15) {
        keywordBoost = 0.08;
      } else if (keywordCount >= 10) {
        keywordBoost = 0.05;
      } else if (keywordCount >= 5) {
        keywordBoost = 0.02;
      } else {
        keywordBoost = -0.02;
      }

      weights.keyword_match += keywordBoost;
      adjustmentsMade = true;
    }

    if (jobDescription) {
      const semanticIndicators = [
        "understand",
        "familiar",
        "knowledge",
        "concept",
        "theory",
        "foundation",
        "principle",
        "approach",
      ];
      const jdLower = jobDescription.toLowerCase();
      const semanticCount = semanticIndicators.filter((word) =>
        jdLower.includes(word)
      ).length;

      if (semanticCount >= 3) {
        weights.semantic_match += 0.05;
        adjustmentsMade = true;
      }

      const domainKeywords = [
        "full stack",
        "end-to-end",
        "comprehensive",
        "broad",
        "wide",
        "diverse",
        "multifaceted",
      ];
      const domainCount = domainKeywords.filter((kw) =>
        jdLower.includes(kw)
      ).length;

      if (domainCount >= 2) {
        weights.semantic_match += 0.05;
        adjustmentsMade = true;
      }
    }

    if (!adjustmentsMade) {
      return { ...ResumeMatchingEngine.STATIC_WEIGHTS };
    }

    for (const key of Object.keys(weights)) {
      weights[key] = Math.max(0.05, weights[key]);
    }

    let total = Object.values(weights).reduce((a, b) => a + b, 0);
    let normalizedWeights: Record<string, number>;
    if (total > 0) {
      normalizedWeights = {};
      for (const [k, v] of Object.entries(weights)) {
        normalizedWeights[k] = v / total;
      }
    } else {
      normalizedWeights = { ...ResumeMatchingEngine.STATIC_WEIGHTS };
    }

    for (const key of Object.keys(normalizedWeights)) {
      normalizedWeights[key] = Math.min(0.6, normalizedWeights[key]);
    }

    total = Object.values(normalizedWeights).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const renormalized: Record<string, number> = {};
      for (const [k, v] of Object.entries(normalizedWeights)) {
        renormalized[k] = v / total;
      }
      normalizedWeights = renormalized;
    }

    return normalizedWeights;
  }

  explainWeights(weights: Record<string, number>): Record<string, string> {
    const explanations: Record<string, string> = {};

    if ((weights.semantic_match ?? 0) > 0.4) {
      explanations.semantic_match =
        "Boosted due to: Technical role, broad skill requirements, or emphasis on understanding concepts.";
    } else if ((weights.semantic_match ?? 0) < 0.35) {
      explanations.semantic_match =
        "Reduced due to: Very specific skill requirements with clear exact matches expected.";
    } else {
      explanations.semantic_match =
        "Standard weight (40%) - balanced emphasis on skill understanding.";
    }

    if ((weights.skill_match ?? 0) > 0.35) {
      explanations.skill_match =
        "Boosted due to: Large number of required skills or high percentage of technical skills.";
    } else if ((weights.skill_match ?? 0) < 0.25) {
      explanations.skill_match =
        "Reduced due to: Few skills required or emphasis on broader qualifications.";
    } else {
      explanations.skill_match =
        "Standard weight (30%) - balanced emphasis on exact skill matches.";
    }

    if ((weights.experience_match ?? 0) > 0.25) {
      explanations.experience_match =
        "Boosted due to: High experience requirement or senior/leadership role.";
    } else if ((weights.experience_match ?? 0) < 0.15) {
      explanations.experience_match =
        "Reduced due to: Entry-level role or low experience requirement.";
    } else {
      explanations.experience_match =
        "Standard weight (20%) - balanced emphasis on experience.";
    }

    if ((weights.keyword_match ?? 0) > 0.15) {
      explanations.keyword_match =
        "Boosted due to: Many specific keywords in requirements.";
    } else if ((weights.keyword_match ?? 0) < 0.05) {
      explanations.keyword_match =
        "Reduced due to: Few keywords or emphasis on broader skills.";
    } else {
      explanations.keyword_match =
        "Standard weight (10%) - balanced emphasis on keyword matching.";
    }

    return explanations;
  }

  async calculateSkillMatchScore(
    requiredSkills: string[],
    preferredSkills: string[],
    candidateSkills: string[]
  ): Promise<Record<string, any>> {
    if (!requiredSkills || requiredSkills.length === 0) {
      return {
        score: 1.0,
        matched: [],
        missing: [],
        partial: [],
        additional: [],
        details: {},
      };
    }

    const matched: any[] = [];
    const partialMatches: any[] = [];
    const missing: string[] = [];
    const details: Record<string, any> = {};

    for (const reqSkill of requiredSkills) {
      let bestMatch: string | null = null;
      let bestScore = 0.0;
      let bestClassification = "unknown";

      for (const candSkill of candidateSkills) {
        const result = await classifySkillPair(reqSkill, candSkill);
        const similarity = result.similarity;
        const classification = result.classification;

        let weightedScore: number;
        if (classification === "equivalent") {
          weightedScore = similarity * 1.0;
        } else if (classification === "related") {
          weightedScore = similarity * 0.7;
        } else {
          weightedScore = 0.0;
        }

        if (weightedScore > bestScore) {
          bestScore = weightedScore;
          bestMatch = candSkill;
          bestClassification = classification;
        }
      }

      if (bestScore >= 0.7) {
        matched.push({
          required: reqSkill,
          matched_with: bestMatch,
          score: bestScore,
          classification: bestClassification,
        });
      } else if (bestScore >= 0.3) {
        partialMatches.push({
          required: reqSkill,
          matched_with: bestMatch,
          score: bestScore,
          classification: bestClassification,
        });
      } else {
        missing.push(reqSkill);
      }

      details[reqSkill] = {
        best_match: bestMatch,
        score: bestScore,
        classification: bestClassification,
      };
    }

    const totalRequired = requiredSkills.length;
    let skillScore: number;
    if (totalRequired === 0) {
      skillScore = 1.0;
    } else {
      const weightedMatches = matched.reduce(
        (sum, m) => sum + m.score,
        0
      );
      const partialWeighted = partialMatches.reduce(
        (sum, p) => sum + p.score * 0.5,
        0
      );
      skillScore = (weightedMatches + partialWeighted) / totalRequired;
    }

    const matchedCandidateSkills = new Set<string>();
    for (const m of matched) {
      if (m.matched_with) {
        matchedCandidateSkills.add(m.matched_with);
      }
    }
    for (const p of partialMatches) {
      if (p.matched_with) {
        matchedCandidateSkills.add(p.matched_with);
      }
    }

    // Calculate preferred skills match
    const preferredMatched: any[] = [];
    const preferredMissing: string[] = [];
    let preferredScoreBonus = 0.0;

    for (const prefSkill of preferredSkills || []) {
      let bestMatch: string | null = null;
      let bestScore = 0.0;
      let bestClassification = "unknown";

      for (const candSkill of candidateSkills) {
        const result = await classifySkillPair(prefSkill, candSkill);
        const similarity = result.similarity;
        const classification = result.classification;

        const weightedScore =
          classification === "equivalent"
            ? similarity
            : classification === "related"
              ? similarity * 0.7
              : 0.0;

        if (weightedScore > bestScore) {
          bestScore = weightedScore;
          bestMatch = candSkill;
          bestClassification = classification;
        }
      }

      if (bestScore >= 0.7) {
        preferredMatched.push({
          required: prefSkill,
          matched_with: bestMatch,
          score: bestScore,
          classification: bestClassification,
        });
        if (bestMatch) {
          matchedCandidateSkills.add(bestMatch);
        }
        preferredScoreBonus += 0.05; // bonus for each preferred skill matched
      } else {
        preferredMissing.push(prefSkill);
      }

      details[prefSkill] = {
        best_match: bestMatch,
        score: bestScore,
        classification: bestClassification,
      };
    }

    const additionalSkills = candidateSkills.filter(
      (skill) => !matchedCandidateSkills.has(skill)
    );

    return {
      score: Math.round(Math.min(skillScore, 1.0) * 10000) / 10000,
      bonus_score: preferredScoreBonus,
      matched,
      partial: partialMatches,
      missing,
      preferred_matched: preferredMatched,
      preferred_missing: preferredMissing,
      additional: additionalSkills,
      details,
    };
  }

  async calculateSemanticMatchScore(
    requiredSkills: string[],
    candidateSkills: string[],
    contextText: string = ""
  ): Promise<Record<string, any>> {
    if (
      !requiredSkills ||
      requiredSkills.length === 0 ||
      !candidateSkills ||
      candidateSkills.length === 0
    ) {
      return { score: 0.0, semantic_matches: [], details: {} };
    }

    const semanticMatches: any[] = [];
    let totalScore = 0.0;

    for (const reqSkill of requiredSkills) {
      let bestMatch: string | null = null;
      let bestScore = 0.0;

      for (const candSkill of candidateSkills) {
        let similarity = await calculateSimilarity(reqSkill, candSkill);

        if (
          contextText &&
          contextText.toLowerCase().includes(candSkill.toLowerCase())
        ) {
          similarity = Math.min(similarity * 1.1, 1.0);
        }

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = candSkill;
        }
      }

      if (bestScore >= 0.3) {
        semanticMatches.push({
          required: reqSkill,
          semantic_match: bestMatch,
          score: bestScore,
        });
        totalScore += bestScore;
      }
    }

    const avgScore =
      requiredSkills.length > 0 ? totalScore / requiredSkills.length : 0;

    return {
      score: Math.round(Math.min(avgScore, 1.0) * 10000) / 10000,
      semantic_matches: semanticMatches,
      details: {
        avg_semantic_score: avgScore,
        total_semantic_matches: semanticMatches.length,
      },
    };
  }

  extractExperienceYears(
    text: string,
    isJd: boolean = false
  ): [number, string] {
    const textLower = text.toLowerCase();
    const extractedYears: Array<[number, RegExpExecArray]> = [];
    let evidenceSnippet = "";

    const patterns = [
      /(\d+)\s*\+\s*years?/g,
      /(\d+)\s*-\s*(\d+)\s*years?/g,
      /(\d+)\s*years?/g,
      /(\d+)\s*\+\s*yrs?/g,
      /(\d+)\s*yrs?/g,
    ];

    let remainingText = textLower;
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(remainingText)) !== null) {
        const valMatch = match;
        let currentYears = 0.0;
        if (valMatch[1] && valMatch[2]) {
          if (isJd) {
            currentYears = parseFloat(valMatch[1]); // Use minimum required
          } else {
            currentYears =
              (parseFloat(valMatch[1]) + parseFloat(valMatch[2])) / 2;
          }
        } else if (valMatch[1]) {
          currentYears = parseFloat(valMatch[1]);
        }

        if (currentYears > 0) {
          extractedYears.push([currentYears, valMatch]);
        }
      }

      // Remove matched patterns with spaces of same length to preserve indices
      pattern.lastIndex = 0;
      remainingText = remainingText.replace(pattern, (m) =>
        " ".repeat(m.length)
      );
    }

    let totalYears = 0.0;

    if (extractedYears.length > 0) {
      let bestMatch: [number, RegExpExecArray];
      if (isJd) {
        bestMatch = extractedYears.reduce((a, b) => (a[0] < b[0] ? a : b));
      } else {
        bestMatch = extractedYears.reduce((a, b) => (a[0] > b[0] ? a : b));
      }

      totalYears = bestMatch[0];
      const match = bestMatch[1];
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      evidenceSnippet =
        "..." + text.slice(start, end).replace(/\n/g, " ").trim() + "...";
    }

    if (totalYears === 0) {
      // Check for months if no years were found
      const monthPattern = /(\d+)\s*months?/g;
      let match: RegExpExecArray | null;
      while ((match = monthPattern.exec(textLower)) !== null) {
        const val = parseFloat(match[1]);
        const currentYears = val / 12.0;
        if (currentYears > totalYears) {
          totalYears = currentYears;
          const start = Math.max(0, match.index - 30);
          const end = Math.min(
            text.length,
            match.index + match[0].length + 30
          );
          evidenceSnippet =
            "..." +
            text.slice(start, end).replace(/\n/g, " ").trim() +
            "...";
        }
      }
    }

    if (totalYears === 0) {
      const sincePattern = /since\s+(\d{4})/gi;
      let match: RegExpExecArray | null;
      while ((match = sincePattern.exec(textLower)) !== null) {
        const yearStr = match[1];
        const year = parseInt(yearStr, 10);
        const currentYear = new Date().getFullYear();
        if (year > 1900 && year <= currentYear) {
          totalYears = Math.max(totalYears, currentYear - year);
          const start = Math.max(0, match.index - 30);
          const end = Math.min(
            text.length,
            match.index + match[0].length + 30
          );
          evidenceSnippet =
            "..." +
            text.slice(start, end).replace(/\n/g, " ").trim() +
            "...";
        }
      }
    }

    if (totalYears === 0) {
      const months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];
      const monthsPattern = months.join("|");

      const dateRangePattern = new RegExp(
        `\\b(${monthsPattern})\\s+(\\d{4})\\s*(?:-|to|–|—)\\s*(?:(${monthsPattern})\\s+(\\d{4})|present|current|now)\\b`,
        "gi"
      );

      let totalMonths = 0;
      let firstMatch: RegExpExecArray | null = null;

      let match: RegExpExecArray | null;
      while ((match = dateRangePattern.exec(textLower)) !== null) {
        if (!firstMatch) {
          firstMatch = match;
        }

        const startMonthStr = match[1];
        const startYearStr = match[2];
        const endMonthStr = match[3];
        const endYearStr = match[4];
        const startYear = parseInt(startYearStr, 10);

        let startMonthIdx = 1;
        for (let i = 0; i < months.length; i++) {
          if (startMonthStr.toLowerCase() === months[i]) {
            startMonthIdx = (i % 12) + 1;
            break;
          }
        }

        let endYear: number;
        let endMonthIdx: number;
        if (endMonthStr && endYearStr) {
          endYear = parseInt(endYearStr, 10);
          endMonthIdx = 1;
          for (let i = 0; i < months.length; i++) {
            if (endMonthStr.toLowerCase() === months[i]) {
              endMonthIdx = (i % 12) + 1;
              break;
            }
          }
        } else {
          const now = new Date();
          endYear = now.getFullYear();
          endMonthIdx = now.getMonth() + 1;
        }

        if (endYear >= startYear) {
          const monthsDiff =
            (endYear - startYear) * 12 + (endMonthIdx - startMonthIdx);
          // adding 1 to make it inclusive
          if (monthsDiff >= 0) {
            totalMonths += monthsDiff + 1;
          }
        }
      }

      if (totalMonths > 0 && firstMatch) {
        totalYears = totalMonths / 12.0;
        const start = Math.max(0, firstMatch.index - 30);
        const end = Math.min(
          text.length,
          firstMatch.index + firstMatch[0].length + 30
        );
        evidenceSnippet =
          "..." + text.slice(start, end).replace(/\n/g, " ").trim() + "...";
      }
    }

    return [totalYears, evidenceSnippet];
  }

  getExperienceLevel(years: number): string {
    for (const [level, [minYears, maxYears]] of Object.entries(
      this.config.experience_levels
    )) {
      if (minYears <= years && years < maxYears) {
        return level;
      }
    }
    return years === 0 ? "entry" : "principal";
  }

  calculateExperienceMatchScore(
    requiredYears: number,
    candidateText: string
  ): Record<string, any> {
    const [candidateYears, evidenceSnippetRaw] =
      this.extractExperienceYears(candidateText);
    let evidenceSnippet = evidenceSnippetRaw;

    const projectKeywords = [
      "github",
      "open source",
      "portfolio",
      "hackathon",
      "personal project",
    ];
    const hasStrongProjects = projectKeywords.some((kw) =>
      candidateText.toLowerCase().includes(kw)
    );

    if (!evidenceSnippet && hasStrongProjects) {
      evidenceSnippet =
        "Experience inferred from strong project/portfolio evidence.";
    } else if (!evidenceSnippet) {
      evidenceSnippet = "No explicit years of experience found in resume.";
    }

    if (requiredYears === 0) {
      return {
        score: 1.0,
        candidate_years: candidateYears,
        required_years: requiredYears,
        difference: 0,
        level_match: "not_applicable",
        has_projects: hasStrongProjects,
        evidence: evidenceSnippet,
      };
    }

    if (candidateYears === 0) {
      const baseScore = hasStrongProjects ? 0.3 : 0.0;
      return {
        score: baseScore,
        candidate_years: 0,
        required_years: requiredYears,
        difference: requiredYears,
        level_match: "unknown",
        has_projects: hasStrongProjects,
        evidence: evidenceSnippet,
      };
    }

    const diff = candidateYears - requiredYears;
    const diffRatio = Math.abs(diff) / requiredYears;

    let score: number;
    if (diffRatio <= 0.2) {
      score = 1.0;
    } else if (diffRatio <= 0.5) {
      score = 0.8;
    } else if (diffRatio <= 1.0) {
      score = 0.6;
    } else {
      score = 0.3;
    }

    const requiredLevel = this.getExperienceLevel(requiredYears);
    const candidateLevel = this.getExperienceLevel(candidateYears);

    if (requiredLevel === candidateLevel) {
      score = Math.min(score + 0.1, 1.0);
    }

    if (diff < 0 && hasStrongProjects) {
      score = Math.min(score + 0.2, 1.0);
    }

    return {
      score: Math.round(Math.min(score, 1.0) * 10000) / 10000,
      candidate_years: candidateYears,
      required_years: requiredYears,
      difference: diff,
      level_match: `${candidateLevel} vs ${requiredLevel}`,
      has_projects: hasStrongProjects,
      evidence: evidenceSnippet,
      details: {
        extracted_from: evidenceSnippet,
      },
    };
  }

  calculateKeywordMatchScore(
    requiredKeywords: string[],
    candidateText: string,
    weightByImportance: boolean = true
  ): Record<string, any> {
    if (!requiredKeywords || requiredKeywords.length === 0) {
      return { score: 1.0, found: [], missing: [], details: {} };
    }

    const candidateLower = candidateText.toLowerCase();
    const found: string[] = [];
    const missing: string[] = [];
    const details: Record<string, any> = {};

    for (const keyword of requiredKeywords) {
      const keywordLower = keyword.toLowerCase();
      const escaped = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`\\b${escaped}\\b`);
      const foundInText = pattern.test(candidateLower);

      details[keyword] = { found: foundInText };

      if (foundInText) {
        found.push(keyword);
      } else {
        missing.push(keyword);
      }
    }

    const totalKeywords = requiredKeywords.length;
    let keywordScore: number;
    if (totalKeywords === 0) {
      keywordScore = 1.0;
    } else if (weightByImportance) {
      const techKeywords = [
        "python",
        "java",
        "aws",
        "docker",
        "kubernetes",
        "react",
        "node",
        "tensorflow",
        "pytorch",
        "sql",
      ];
      const weights: Record<string, number> = {};
      for (const kw of requiredKeywords) {
        weights[kw] = techKeywords.some((tech) =>
          kw.toLowerCase().includes(tech)
        )
          ? 2.0
          : 1.0;
      }
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      const scoreWeighted =
        found.reduce((sum, kw) => sum + weights[kw], 0) / totalWeight;
      keywordScore = scoreWeighted;
    } else {
      keywordScore = found.length / totalKeywords;
    }

    return {
      score: Math.round(Math.min(keywordScore, 1.0) * 10000) / 10000,
      found,
      missing,
      details,
    };
  }

  async calculateOverallScore(
    requiredSkills: string[],
    preferredSkills: string[],
    candidateSkills: string[],
    requiredExperienceYears: number,
    candidateResumeText: string,
    requiredKeywords: string[] | null = null,
    contextText: string = "",
    jobDescription: string = "",
    jobRequirements: Record<string, any> | null = null,
    useDynamicWeights: boolean = true,
    customWeights: Record<string, number> | null = null,
    resumeSections: Record<string, string> | null = null
  ): Promise<Record<string, any>> {
    let weights: Record<string, number>;
    let weightSource: string;
    let weightExplanations: Record<string, string> | null;

    if (customWeights) {
      weights = customWeights;
      weightSource = "custom";
      weightExplanations = null;
    } else if (useDynamicWeights) {
      if (jobRequirements === null) {
        jobRequirements = {
          required_skills: requiredSkills,
          required_years: requiredExperienceYears,
          keywords: requiredKeywords || [],
        };
      }

      weights = this.calculateDynamicWeights(jobRequirements, jobDescription);
      weightSource = "dynamic";
      weightExplanations = this.explainWeights(weights);
    } else {
      weights = { ...ResumeMatchingEngine.STATIC_WEIGHTS };
      weightSource = "static";
      weightExplanations = {};
      for (const k of Object.keys(weights)) {
        weightExplanations[k] = "Static weight (fallback)";
      }
    }

    const skillResult = await this.calculateSkillMatchScore(
      requiredSkills,
      preferredSkills,
      candidateSkills
    );
    const skillScore = skillResult.score;
    const bonusScore = skillResult.bonus_score ?? 0.0;

    const semanticResult = await this.calculateSemanticMatchScore(
      requiredSkills,
      candidateSkills,
      contextText
    );
    const semanticScore = semanticResult.score;

    const experienceResult = this.calculateExperienceMatchScore(
      requiredExperienceYears,
      candidateResumeText
    );
    const experienceScore = experienceResult.score;

    const keywords = requiredKeywords || requiredSkills;
    const keywordResult = this.calculateKeywordMatchScore(
      keywords,
      candidateResumeText
    );
    const keywordScore = keywordResult.score;

    let finalScore =
      weights.semantic_match * semanticScore +
      weights.skill_match * skillScore +
      weights.experience_match * experienceScore +
      weights.keyword_match * keywordScore +
      bonusScore;
    finalScore = Math.min(finalScore, 1.0);

    const confidence = this.calculateConfidence(
      skillResult,
      semanticResult,
      experienceResult,
      keywordResult
    );

    const insights = this.identifyStrengthsAndGaps(
      skillResult,
      experienceResult,
      keywordResult,
      candidateResumeText
    );

    const analysisData = {
      missing_skills: skillResult.missing ?? [],
      matched_skills: (skillResult.matched ?? [])
        .filter((s: any) => s.matched_with)
        .map((s: any) => s.matched_with),
      additional_skills: skillResult.additional ?? [],
      skill_score: skillScore,
      experience_score: experienceScore,
      keyword_score: keywordScore,
      semantic_score: semanticScore,
      overqualification_flag: (insights.gaps as string[]).some((gap) =>
        gap.toLowerCase().includes("overqualified")
      ),
      skill_importance: jobRequirements?.skill_importance ?? {},
      skill_frequency: jobRequirements?.skill_frequency ?? {},
      has_projects: experienceResult.has_projects ?? false,
      experience_difference: experienceResult.difference ?? 0.0,
      resume_sections: resumeSections || {},
    };
    const recommendations = generateRecommendations(analysisData);

    const matchedSkillsList = analysisData.matched_skills;
    const compatibilityLevel =
      finalScore >= 0.85
        ? "Excellent"
        : finalScore >= 0.7
          ? "Strong"
          : finalScore >= 0.5
            ? "Moderate"
            : "Low";

    const compatibilityAnalysis = {
      overall_compatibility: compatibilityLevel,
      score: Math.round(finalScore * 10000) / 10000,
      evidence: {
        skills_evidence: matchedSkillsList.length
          ? `Explicitly matched ${matchedSkillsList.length} required skills (${matchedSkillsList.slice(0, 5).join(", ")}${matchedSkillsList.length > 5 ? "..." : ""}).`
          : "No explicit required skills matched.",
        experience_evidence:
          experienceResult.evidence ?? "No evidence found.",
        semantic_evidence:
          semanticScore >= 0.6
            ? "Resume concepts align strongly with the job description."
            : "Concepts somewhat differ from job requirements.",
        keyword_evidence: (keywordResult.found ?? []).length
          ? `Found ${keywordResult.found.length} exact keyword matches.`
          : "Low keyword alignment.",
      },
    };

    return {
      overall_score: Math.round(finalScore * 10000) / 10000,
      compatibility_analysis: compatibilityAnalysis,
      weight_source: weightSource,
      weights_used: weights,
      weight_explanations: weightExplanations,
      score_breakdown: {
        semantic_match: Math.round(semanticScore * 10000) / 10000,
        skill_match: Math.round(skillScore * 10000) / 10000,
        experience_match: Math.round(experienceScore * 10000) / 10000,
        keyword_match: Math.round(keywordScore * 10000) / 10000,
      },
      weighted_contributions: {
        semantic_match:
          Math.round(weights.semantic_match * semanticScore * 10000) / 10000,
        skill_match:
          Math.round(weights.skill_match * skillScore * 10000) / 10000,
        experience_match:
          Math.round(weights.experience_match * experienceScore * 10000) /
          10000,
        keyword_match:
          Math.round(weights.keyword_match * keywordScore * 10000) / 10000,
      },
      confidence,
      matched_skills: (skillResult.matched ?? [])
        .filter((s: any) => s.matched_with)
        .map((s: any) => s.matched_with),
      missing_skills: skillResult.missing ?? [],
      preferred_matched: (skillResult.preferred_matched ?? [])
        .filter((s: any) => s.matched_with)
        .map((s: any) => s.matched_with),
      preferred_missing: skillResult.preferred_missing ?? [],
      additional_skills: skillResult.additional ?? [],
      strengths: insights.strengths,
      gaps: insights.gaps,
      recommendations,
      details: {
        skill_details: skillResult,
        semantic_details: semanticResult,
        experience_details: experienceResult,
        keyword_details: keywordResult,
      },
    };
  }

  private calculateConfidence(
    skillResult: Record<string, any>,
    semanticResult: Record<string, any>,
    experienceResult: Record<string, any>,
    _keywordResult: Record<string, any>
  ): Record<string, any> {
    const confidenceFactors: number[] = [];

    const totalRequired = Object.keys(skillResult.details ?? {}).length;
    if (totalRequired > 0) {
      const factor = Math.min(1.0, totalRequired / 10);
      confidenceFactors.push(factor);
    }

    if ((experienceResult.candidate_years ?? 0) > 0) {
      confidenceFactors.push(1.0);
    } else {
      confidenceFactors.push(0.3);
    }

    const semanticMatches: any[] = semanticResult.semantic_matches ?? [];
    if (semanticMatches.length > 0) {
      const avgSemScore =
        semanticMatches.reduce((sum, m) => sum + m.score, 0) /
        semanticMatches.length;
      confidenceFactors.push(Math.min(1.0, avgSemScore));
    } else {
      confidenceFactors.push(0.5);
    }

    const avgConfidence =
      confidenceFactors.length > 0
        ? confidenceFactors.reduce((a, b) => a + b, 0) /
          confidenceFactors.length
        : 0.5;

    let level: string;
    if (avgConfidence >= 0.8) {
      level = "high";
    } else if (avgConfidence >= 0.6) {
      level = "medium";
    } else if (avgConfidence >= 0.4) {
      level = "low";
    } else {
      level = "very_low";
    }

    return {
      level,
      score: Math.round(avgConfidence * 10000) / 10000,
      factors: {
        skill_count: totalRequired,
        experience_available: (experienceResult.candidate_years ?? 0) > 0,
        semantic_coverage: semanticMatches.length > 0,
      },
    };
  }

  private identifyStrengthsAndGaps(
    skillResult: Record<string, any>,
    experienceResult: Record<string, any>,
    keywordResult: Record<string, any>,
    candidateResumeText: string
  ): { strengths: string[]; gaps: string[] } {
    const strengths: string[] = [];
    const gaps: string[] = [];

    const reqYears = experienceResult.required_years ?? 0;
    const candYears = experienceResult.candidate_years ?? 0;
    if (reqYears >= 0) {
      if (candYears >= reqYears) {
        const diff = candYears - reqYears;
        if (reqYears <= 1 && diff >= 3) {
          gaps.push(
            `May be overqualified for this position (${candYears} years vs required ${reqYears}).`
          );
        } else if (diff >= 2) {
          strengths.push(`Exceeds experience requirement by ${diff} years.`);
        } else if (reqYears > 0) {
          strengths.push("Meets experience requirement.");
        }
      } else {
        const diff = reqYears - candYears;
        const hasProjects = experienceResult.has_projects ?? false;
        if (hasProjects) {
          gaps.push(
            `Falls short of formal experience requirement by ${diff.toFixed(1)} years, but this may be offset by strong project work.`
          );
          strengths.push(
            "Demonstrates practical experience through projects/portfolio."
          );
        } else {
          gaps.push(
            `Falls short of experience requirement by ${diff.toFixed(1)} years.`
          );
        }
      }
    }

    const matchedSkills: any[] = skillResult.matched ?? [];
    if (matchedSkills.length > 0) {
      const topSkills = matchedSkills
        .slice(0, 5)
        .filter((s) => s.matched_with)
        .map((s) => s.matched_with);
      if (topSkills.length > 0) {
        strengths.push(
          `Strong match for required skills: ${topSkills.join(", ")}.`
        );
      }
    }

    const additionalSkills: string[] = skillResult.additional ?? [];
    if (additionalSkills.length > 0) {
      strengths.push(
        `Brings additional skills not explicitly required: ${additionalSkills.join(", ")}.`
      );
    }

    const missingSkills: string[] = skillResult.missing ?? [];
    if (missingSkills.length > 0) {
      gaps.push(`Missing required skills: ${missingSkills.join(", ")}.`);
    }

    const keywordScore = keywordResult.score ?? 0;
    if (keywordScore >= 0.8) {
      strengths.push("Resume terminology highly aligns with job description.");
    } else if (keywordScore <= 0.4) {
      gaps.push(
        "Resume terminology lacks key terms from the job description."
      );
    }

    const textLower = candidateResumeText.toLowerCase();
    if (["ph.d", "phd", "doctorate"].some((term) => textLower.includes(term))) {
      strengths.push("Holds a Doctorate degree (Ph.D).");
    } else if (
      ["master's", "masters", "m.s.", "m.a.", "mba"].some((term) =>
        textLower.includes(term)
      )
    ) {
      strengths.push("Holds a Master's degree.");
    }

    if (["volunteer", "volunteering"].some((term) => textLower.includes(term))) {
      strengths.push("Has volunteer experience.");
    }

    if (["certif"].some((term) => textLower.includes(term))) {
      strengths.push("Has professional certifications.");
    }

    if (["published", "publication"].some((term) => textLower.includes(term))) {
      strengths.push("Has publications or published work.");
    }

    if (["award", "won "].some((term) => textLower.includes(term))) {
      strengths.push("Has received professional awards or recognition.");
    }

    if (
      ["launched", "shipped", "released"].some((term) =>
        textLower.includes(term)
      )
    ) {
      strengths.push(
        "Has experience successfully launching products or projects."
      );
    }

    if (
      ["led a team", "managed a team", "leading", "leadership", "led"].some(
        (term) => textLower.includes(term)
      )
    ) {
      strengths.push("Possesses team leadership or management experience.");
    }

    return {
      strengths,
      gaps,
    };
  }

  async rankCandidates(
    jobRequirements: Record<string, any>,
    candidates: Array<Record<string, any>>,
    jobDescription: string = "",
    useDynamicWeights: boolean = true
  ): Promise<Array<Record<string, any>>> {
    const rankedCandidates: Array<Record<string, any>> = [];

    for (const candidate of candidates) {
      const scoreResult = await this.calculateOverallScore(
        jobRequirements.required_skills ?? [],
        jobRequirements.preferred_skills ?? [],
        candidate.skills ?? [],
        jobRequirements.required_years ?? 0,
        candidate.resume_text ?? "",
        jobRequirements.keywords ?? null,
        candidate.context ?? "",
        jobDescription,
        jobRequirements,
        useDynamicWeights
      );

      rankedCandidates.push({
        candidate_id: candidate.id,
        candidate_name: candidate.name,
        overall_score: scoreResult.overall_score,
        weight_source: scoreResult.weight_source,
        weights_used: scoreResult.weights_used,
        weight_explanations: scoreResult.weight_explanations ?? {},
        score_breakdown: scoreResult.score_breakdown,
        confidence: scoreResult.confidence,
        matched_skills: scoreResult.matched_skills ?? [],
        missing_skills: scoreResult.missing_skills ?? [],
        additional_skills: scoreResult.additional_skills ?? [],
        strengths: scoreResult.strengths ?? [],
        gaps: scoreResult.gaps ?? [],
        details: scoreResult.details,
      });
    }

    return rankedCandidates.sort(
      (a, b) => b.overall_score - a.overall_score
    );
  }
}
