import { getOwnerId } from "@/lib/owner";
import {
  deleteAnalysis as dbDeleteAnalysis,
  getAnalysis as dbGetAnalysis,
  getResume,
  getResumePdfBlob,
  listHistory,
  listResumes,
  saveAnalysis,
  saveResume,
} from "@/lib/db/store";
import { cleanText } from "@/lib/engine/textProcessor";
import { detectSections } from "@/lib/engine/sectionDetector";
import {
  extractCategorizedSkills,
  extractSkillsFromText,
} from "@/lib/engine/skillExtractor";
import { ResumeMatchingEngine } from "@/lib/engine/matchingEngine";
import { extractTextFromFile } from "@/lib/engine/pdfParser";
import { preloadEmbeddingModel } from "@/lib/engine/embeddings";

export { getOwnerId };

async function runMatch(resumeText: string, jdText: string, sections: Record<string, string>) {
  await preloadEmbeddingModel();
  const engine = new ResumeMatchingEngine();
  const categorized = extractCategorizedSkills(jdText);
  const requiredSkills = categorized.must_have;
  const preferredSkills = categorized.preferred;
  const allRequired = [...requiredSkills, ...preferredSkills];
  const candidateSkills = extractSkillsFromText(resumeText, allRequired);
  const keywords = requiredSkills.map((sk) => sk.toLowerCase());
  const [reqYears] = engine.extractExperienceYears(jdText, true);

  const jobRequirements = {
    required_skills: requiredSkills,
    preferred_skills: preferredSkills,
    required_years: reqYears,
    keywords,
  };

  return engine.calculateOverallScore(
    requiredSkills,
    preferredSkills,
    candidateSkills,
    reqYears,
    resumeText,
    keywords,
    "",
    jdText,
    jobRequirements,
    true,
    null,
    sections,
  );
}

export async function uploadAndAnalyze(input: {
  file: File;
  jdText?: string;
  jdFile?: File | null;
}) {
  if (input.file.type !== "application/pdf" && !input.file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are supported for resume.");
  }

  const pdfBuffer = await input.file.arrayBuffer();
  if (!pdfBuffer.byteLength) {
    throw new Error("Uploaded resume file is empty.");
  }

  const rawText = await extractTextFromFile(input.file);
  const cleanedText = cleanText(rawText);
  const sections = detectSections(cleanedText);

  let jdText = input.jdText?.trim() || "";
  if (input.jdFile) {
    jdText = cleanText(await extractTextFromFile(input.jdFile));
  }

  const resume = await saveResume({
    owner_id: getOwnerId(),
    filename: input.file.name,
    raw_text: cleanedText,
    pdf_content: pdfBuffer.slice(0),
  });

  const responseData: Record<string, unknown> = {
    id: resume.id,
    filename: resume.filename,
    text: cleanedText,
    sections,
  };

  if (jdText) {
    const matchResult = await runMatch(cleanedText, jdText, sections);
    const analysis = await saveAnalysis({
      resume_id: resume.id,
      job_description: jdText,
      overall_score: matchResult.overall_score ?? null,
      match_result: matchResult,
    });
    responseData.match_result = matchResult;
    responseData.analysis_id = analysis.id;
  }

  return responseData;
}

export async function analyzeExisting(input: {
  resumeId: number;
  jdText?: string;
  jdFile?: File | null;
}) {
  const resume = await getResume(input.resumeId, getOwnerId());
  if (!resume) {
    throw new Error("Resume not found");
  }

  let jdText = input.jdText?.trim() || "";
  if (input.jdFile) {
    jdText = cleanText(await extractTextFromFile(input.jdFile));
  }

  const sections = detectSections(resume.raw_text);
  const responseData: Record<string, unknown> = {
    id: resume.id,
    filename: resume.filename,
    text: resume.raw_text,
    sections,
  };

  if (jdText) {
    const matchResult = await runMatch(resume.raw_text, jdText, sections);
    const analysis = await saveAnalysis({
      resume_id: resume.id,
      job_description: jdText,
      overall_score: matchResult.overall_score ?? null,
      match_result: matchResult,
    });
    responseData.match_result = matchResult;
    responseData.analysis_id = analysis.id;
  }

  return responseData;
}

export async function fetchResumeList() {
  return listResumes(getOwnerId());
}

export async function fetchHistory() {
  return listHistory(getOwnerId());
}

export async function fetchAnalysis(analysisId: number) {
  const analysis = await dbGetAnalysis(analysisId, getOwnerId());
  if (!analysis) throw new Error("Analysis not found");
  return analysis;
}

export async function fetchResumePdfUrl(resumeId: number): Promise<string | null> {
  const blob = await getResumePdfBlob(resumeId, getOwnerId());
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function removeAnalysis(analysisId: number) {
  const ok = await dbDeleteAnalysis(analysisId, getOwnerId());
  if (!ok) throw new Error("Failed to delete analysis");
}
