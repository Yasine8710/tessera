export type ErrorCode = "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "CONFLICT" | "RATE_LIMITED" | "UNAUTHENTICATED";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const forbidden = (m = "You do not have access to this.") => new AppError("FORBIDDEN", m);
export const notFound = (m = "Not found.") => new AppError("NOT_FOUND", m);
export const invalid = (m: string) => new AppError("INVALID", m);
export const conflict = (m: string) => new AppError("CONFLICT", m);
