// A unique build marker lets the post-deploy check prove that the exact GitHub Actions artifact—not
// merely any healthy older release—has reached the public custom domain.
export function GET() {
  const marker = String(process.env.DEPLOY_MARKER || 'local').trim();
  return new Response(`${marker}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
