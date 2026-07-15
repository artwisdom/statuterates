// Dynamic ads.txt — the IAB authorized-sellers file AdSense requires so Google will serve (and pay
// for) ads on this domain. One-switch: set the ADSENSE_CLIENT env var (ca-pub-XXXXXXXXXXXXXXXX) and
// redeploy; the correct google.com line is emitted automatically. Empty until then (no revenue leak,
// no invalid file). f08c47fec0942fa0 is Google's fixed certification-authority ID.
export function GET() {
  const client = (process.env.ADSENSE_CLIENT || '').trim();
  const pub = client.replace(/^ca-/, ''); // ca-pub-XXXX -> pub-XXXX
  const body = /^pub-\d{10,}$/.test(pub)
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : `# ads.txt — no ad network configured yet.\n# When approved by Google AdSense, set the ADSENSE_CLIENT\n# repo/env variable to your ca-pub-XXXXXXXXXXXXXXXX id and redeploy;\n# this file will then authorize Google to serve ads on this domain.\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
