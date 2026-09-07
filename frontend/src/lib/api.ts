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

function withOwnerId(input: string): string {
  const ownerId = encodeURIComponent(getOwnerId());
  const join = input.includes("?") ? "&" : "?";
  return `${input}${join}owner_id=${ownerId}`;
}

/**
 * fetch wrapper that scopes requests via owner_id query param (avoids CORS preflight).
 * Retries on 502/503 for Railway cold starts.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = withOwnerId(input);
  const maxAttempts = 5;
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init);
      lastResponse = response;

      if (response.status !== 502 && response.status !== 503) {
        return response;
      }
    } catch (error) {
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
