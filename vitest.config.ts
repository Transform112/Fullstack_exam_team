import { defineConfig } from "vitest/config";
import path from "node:path";

// Logic and API-integration tests (docs/05 SECTION 1). No database is required for the
// pure-logic suites; integration suites run against an isolated test database.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
    testTimeout: 15000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
