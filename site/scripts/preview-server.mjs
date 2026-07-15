// Minimal static file server for the built dist/ — used only for local preview verification.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../dist/', import.meta.url)); // decodes %20 in the path
const PORT = process.env.PORT || 4331;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

async function resolve(p) {
  let fp = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
  try {
    const s = await stat(fp);
    if (s.isDirectory()) fp = join(fp, 'index.html');
    return fp;
  } catch {
    // pretty-url fallback: /foo -> /foo/index.html
    try { const s2 = await stat(fp + '/index.html'); if (s2) return fp + '/index.html'; } catch {}
    return null;
  }
}

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const fp = await resolve(url);
  if (!fp) {
    const nf = join(ROOT, '404.html');
    try { const body = await readFile(nf); res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(body); }
    catch { res.writeHead(404); return res.end('Not found'); }
  }
  try {
    const body = await readFile(fp);
    res.writeHead(200, { 'Content-Type': TYPES[extname(fp)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(500); res.end('Server error'); }
}).listen(PORT, () => console.log(`StatuteRates preview at http://localhost:${PORT}`));
