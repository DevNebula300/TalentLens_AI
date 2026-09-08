import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface ResumeRecord {
  id: number;
  owner_id: string;
  filename: string;
  raw_text: string;
  pdf_content: ArrayBuffer | null;
  created_at: string;
}

export interface AnalysisRecord {
  id: number;
  resume_id: number;
  job_description: string;
  overall_score: number | null;
  match_result: Record<string, unknown>;
  created_at: string;
}

interface TalentLensDB extends DBSchema {
  meta: {
    key: string;
    value: number;
  };
  resumes: {
    key: number;
    value: ResumeRecord;
    indexes: { "by-owner": string };
  };
  analyses: {
    key: number;
    value: AnalysisRecord;
    indexes: { "by-resume": number };
  };
}

const DB_NAME = "talentlens";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TalentLensDB>> | null = null;

function getDb() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<TalentLensDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("meta");
        const resumes = db.createObjectStore("resumes", { keyPath: "id" });
        resumes.createIndex("by-owner", "owner_id");
        const analyses = db.createObjectStore("analyses", { keyPath: "id" });
        analyses.createIndex("by-resume", "resume_id");
      },
    });
  }
  return dbPromise;
}

async function nextId(counterKey: "resume_id" | "analysis_id"): Promise<number> {
  const db = await getDb();
  const tx = db.transaction("meta", "readwrite");
  const current = (await tx.store.get(counterKey)) ?? 0;
  const next = current + 1;
  await tx.store.put(next, counterKey);
  await tx.done;
  return next;
}

export async function saveResume(input: {
  owner_id: string;
  filename: string;
  raw_text: string;
  pdf_content: ArrayBuffer | null;
}): Promise<ResumeRecord> {
  const db = await getDb();
  const id = await nextId("resume_id");
  const record: ResumeRecord = {
    id,
    owner_id: input.owner_id,
    filename: input.filename,
    raw_text: input.raw_text,
    pdf_content: input.pdf_content,
    created_at: new Date().toISOString(),
  };
  await db.put("resumes", record);
  return record;
}

export async function listResumes(ownerId: string): Promise<
  Array<{ id: number; filename: string; created_at: string }>
> {
  const db = await getDb();
  const rows = await db.getAllFromIndex("resumes", "by-owner", ownerId);
  return rows
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => ({
      id: r.id,
      filename: r.filename,
      created_at: r.created_at,
    }));
}

export async function getResume(
  resumeId: number,
  ownerId: string,
): Promise<ResumeRecord | undefined> {
  const db = await getDb();
  const resume = await db.get("resumes", resumeId);
  if (!resume || resume.owner_id !== ownerId) return undefined;
  return resume;
}

export async function saveAnalysis(input: {
  resume_id: number;
  job_description: string;
  overall_score: number | null;
  match_result: Record<string, unknown>;
}): Promise<AnalysisRecord> {
  const db = await getDb();
  const id = await nextId("analysis_id");
  const record: AnalysisRecord = {
    id,
    resume_id: input.resume_id,
    job_description: input.job_description,
    overall_score: input.overall_score,
    match_result: input.match_result,
    created_at: new Date().toISOString(),
  };
  await db.put("analyses", record);
  return record;
}

export async function listHistory(ownerId: string) {
  const db = await getDb();
  const resumes = await db.getAllFromIndex("resumes", "by-owner", ownerId);
  const resumeMap = new Map(resumes.map((r) => [r.id, r]));
  const analyses = await db.getAll("analyses");

  return analyses
    .filter((a) => resumeMap.has(a.resume_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((analysis) => {
      const resume = resumeMap.get(analysis.resume_id)!;
      const jd = (analysis.job_description || "").trim();
      const jd_snippet = jd
        ? jd.length > 60
          ? `${jd.slice(0, 60)}...`
          : jd
        : "General Analysis";
      return {
        id: analysis.id,
        resume_id: resume.id,
        filename: resume.filename,
        overall_score: analysis.overall_score,
        created_at: analysis.created_at,
        jd_snippet,
      };
    });
}

export async function getAnalysis(analysisId: number, ownerId: string) {
  const db = await getDb();
  const analysis = await db.get("analyses", analysisId);
  if (!analysis) return undefined;
  const resume = await db.get("resumes", analysis.resume_id);
  if (!resume || resume.owner_id !== ownerId) return undefined;

  return {
    id: analysis.id,
    resume_id: resume.id,
    filename: resume.filename,
    resume_text: resume.raw_text,
    has_pdf: Boolean(resume.pdf_content && resume.pdf_content.byteLength > 0),
    job_description: analysis.job_description,
    overall_score: analysis.overall_score,
    match_result: analysis.match_result,
    created_at: analysis.created_at,
  };
}

export async function getResumePdfBlob(
  resumeId: number,
  ownerId: string,
): Promise<Blob | null> {
  const resume = await getResume(resumeId, ownerId);
  if (!resume?.pdf_content) return null;
  return new Blob([new Uint8Array(resume.pdf_content)], {
    type: "application/pdf",
  });
}

export async function deleteAnalysis(
  analysisId: number,
  ownerId: string,
): Promise<boolean> {
  const db = await getDb();
  const analysis = await db.get("analyses", analysisId);
  if (!analysis) return false;
  const resume = await db.get("resumes", analysis.resume_id);
  if (!resume || resume.owner_id !== ownerId) return false;
  await db.delete("analyses", analysisId);
  return true;
}
