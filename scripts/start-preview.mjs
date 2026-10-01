import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";

nextEnv.loadEnvConfig(process.cwd(), true);

const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3001");
if (appUrl.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(appUrl.hostname)) {
  throw new Error(
    "For local preview, set NEXT_PUBLIC_APP_URL to an http://localhost:<port> or http://127.0.0.1:<port> URL.",
  );
}
process.env.NEXT_PUBLIC_APP_URL = appUrl.origin;
const port = appUrl.port || "80";
const cliUrl = import.meta.resolve("next/dist/bin/next");
process.argv = [process.argv[0], fileURLToPath(cliUrl), "dev", "--hostname", "127.0.0.1", "--port", port];
await import(cliUrl);