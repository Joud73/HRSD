/** Error carrying a user-facing Arabic message; the database error stays on `cause`. */
export class ServiceError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ServiceError";
  }
}

/** Saudi national ID (starts with 1) or iqama (starts with 2), 10 digits. Mirrors the database check. */
export const SAUDI_ID_RE = /^[12][0-9]{9}$/;
