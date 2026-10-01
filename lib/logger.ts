import pino from "pino";

// Strips credentials from anything that might be logged, for example a MongoDB URI
// embedded in a driver error message.
export function redactSecrets(text: string) {
  return text
    .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s/]+@/gi, "$1***@")
    .replace(/(api_secret=)[^&\s]+/gi, "$1***");
}

// Structured JSON logs with secrets redacted. Never log raw IPs, cookies or tokens.
export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: undefined,
  redact: {
    paths: [
      "req.headers.cookie",
      "cookie",
      "password",
      "*.password",
      "passwordHash",
      "*.passwordHash",
      "token",
      "*.token",
      "authorization",
      "MONGO_URI",
      "CLOUDINARY_API_SECRET",
      "JWT_SECRET",
      "UNLOCK_JWT_SECRET",
      "IP_HASH_SECRET",
      "GEMINI_API_KEY",
    ],
    remove: true,
  },
});

// Short, log-friendly request id. Attached to every log line and error response.
export function newRequestId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
