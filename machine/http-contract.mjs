// Shared public-delivery assertions for machine-readable resources. A valid body is not useful to
// browser and API consumers if the edge serves it under the wrong media type or removes CORS.

export function requireMachineResponseHeaders(label, response, expectedMediaType) {
  if (!response?.headers || typeof response.headers.get !== 'function') {
    throw new Error(`${label} has no readable response headers`);
  }
  const contentType = response.headers.get('content-type') || '';
  const actualMediaType = contentType.split(';', 1)[0].trim().toLowerCase();
  const requiredMediaType = String(expectedMediaType || '').trim().toLowerCase();
  if (!requiredMediaType || actualMediaType !== requiredMediaType) {
    throw new Error(
      `${label} expected Content-Type ${requiredMediaType || '(missing expectation)'}, `
      + `received ${JSON.stringify(contentType)}`,
    );
  }

  const allowOrigin = (response.headers.get('access-control-allow-origin') || '').trim();
  if (allowOrigin !== '*') {
    throw new Error(
      `${label} expected Access-Control-Allow-Origin: *, received ${JSON.stringify(allowOrigin)}`,
    );
  }
}
