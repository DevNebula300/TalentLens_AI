export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const OWNER_STORAGE_KEY = "talentlens_owner_id";

/** Stable per-browser owner token used to keep resumes/history private. */
export function getOwnerId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let ownerId = window.localStorage.getItem(OWNER_STORAGE_KEY);
  if (!ownerId) {
    ownerId = crypto.randomUUID();
    window.localStorage.setItem(OWNER_STORAGE_KEY, ownerId);
  }
  return ownerId;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch wrapper that always sends the owner identity header.
 * Retries on 502/503 for Railway Serverless cold starts (can take a while).
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-Owner-Id", getOwnerId());

  const maxAttempts = 5;
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(input, { ...init, headers });
      lastResponse = response;

      if (response.status !== 502 && response.status !== 503) {
        return response;
      }
    } catch (error) {
      // net::ERR_FAILED during CORS/cold-start often surfaces as a thrown TypeError
      lastError = error;
    }

    if (attempt < maxAttempts) {
      await sleep(2000 * attempt);
    }
  }

  if (lastResponse) {
    return lastResponse;
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to reach backend");
}
