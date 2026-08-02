// Public, permanent OpenAPI discovery URL. The repository contract remains the single source of
// truth; Astro emits it as a static file beside the site and API.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const candidates = [
  resolve(process.cwd(), '..', 'machine', 'openapi.yaml'),
  resolve(process.cwd(), 'machine', 'openapi.yaml'),
  resolve(__dirname, '..', '..', '..', 'machine', 'openapi.yaml'),
];
const path = candidates.find(existsSync);
if (!path) throw new Error('Unable to locate machine/openapi.yaml');
const spec = readFileSync(path, 'utf8');

export function GET() {
  return new Response(spec, {
    headers: {
      'Content-Type': 'application/yaml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
