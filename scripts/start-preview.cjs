// Local preview: keep the listening port and the API origin allowlist in sync.
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd(), true);

const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3001');
if (appUrl.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(appUrl.hostname)) {
  throw new Error('For local preview, set NEXT_PUBLIC_APP_URL to an http://localhost:<port> or http://127.0.0.1:<port> URL.');
}
process.env.NEXT_PUBLIC_APP_URL = appUrl.origin;
const port = appUrl.port || '80';
// Explicit port selection fails clearly if occupied rather than changing the origin.
process.argv = [process.argv[0], require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', port];
require('next/dist/bin/next');
