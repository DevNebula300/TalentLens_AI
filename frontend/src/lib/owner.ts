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
