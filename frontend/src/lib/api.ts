/**
 * Client-side API facade.
 * Analysis, storage, and MiniLM matching all run in the browser (IndexedDB + Transformers.js).
 * Kept for backwards-compatible imports from pages.
 */
export { getOwnerId } from "./owner";
export {
  uploadAndAnalyze,
  analyzeExisting,
  fetchResumeList,
  fetchHistory,
  fetchAnalysis,
  fetchResumePdfUrl,
  removeAnalysis,
} from "./clientApi";

/** @deprecated No remote backend required for demos. */
export const API_BASE_URL = "";
