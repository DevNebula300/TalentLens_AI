import { SKILL_ALIASES } from "./skillAliases";
import { similarity } from "./embeddings";

export const EQUIVALENT_THRESHOLD = 0.85;
export const RELATED_THRESHOLD = 0.65;

const similarityCache = new Map<string, number>();

export function normalizeSkill(skill: string): string {
  const normalized = skill.toLowerCase().trim();
  return SKILL_ALIASES[normalized] ?? normalized;
}

function cacheKey(a: string, b: string): string {
  return a < b ? `${a}||${b}` : `${b}||${a}`;
}

export async function calculateSimilarity(
  skillA: string,
  skillB: string,
): Promise<number> {
  const normA = normalizeSkill(skillA);
  const normB = normalizeSkill(skillB);

  if (normA === normB) return 1.0;

  const key = cacheKey(normA, normB);
  const cached = similarityCache.get(key);
  if (cached !== undefined) return cached;

  const score = await similarity(normA, normB);
  similarityCache.set(key, score);
  return score;
}

export function classifySimilarity(score: number): string {
  if (score >= EQUIVALENT_THRESHOLD) return "equivalent";
  if (score >= RELATED_THRESHOLD) return "related";
  return "unknown";
}

export async function classifySkillPair(
  skillA: string,
  skillB: string,
): Promise<{
  skill_a: string;
  skill_b: string;
  similarity: number;
  classification: string;
}> {
  if (!skillA.trim() || !skillB.trim()) {
    throw new Error("Skills cannot be empty.");
  }

  const score = await calculateSimilarity(skillA, skillB);
  return {
    skill_a: skillA,
    skill_b: skillB,
    similarity: Math.round(score * 10000) / 10000,
    classification: classifySimilarity(score),
  };
}
