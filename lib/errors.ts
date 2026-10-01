// Central error types. Every API failure is expressed as an AppError so the route
// wrapper can map it to the standard { success:false, error:{code,message,details} } shape.
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown[];

  constructor(status: number, code: string, message: string, details?: unknown[]) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  validation: (message: string, details?: unknown[]) =>
    new AppError(400, "VALIDATION_ERROR", message, details),
  unauthenticated: () => new AppError(401, "UNAUTHENTICATED", "Please log in to continue."),
  forbidden: (message = "You do not have permission to do this.") =>
    new AppError(403, "FORBIDDEN", message),
  notFound: (message = "Not found.") => new AppError(404, "NOT_FOUND", message),
  conflict: (code: string, message: string) => new AppError(409, code, message),
  rateLimited: () =>
    new AppError(429, "RATE_LIMITED", "Too many requests. Please try again later."),
};
