import assert from 'node:assert/strict';
import test from 'node:test';

import { requireMachineResponseHeaders } from './http-contract.mjs';

test('accepts the exact machine media type with a charset and public CORS', () => {
  const response = new Response('{}', {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
    },
  });
  assert.doesNotThrow(() => requireMachineResponseHeaders('API metadata', response, 'application/json'));
});

test('rejects a machine resource delivered under the wrong media type', () => {
  const response = new Response('{}', {
    headers: {
      'content-type': 'text/plain',
      'access-control-allow-origin': '*',
    },
  });
  assert.throws(
    () => requireMachineResponseHeaders('API metadata', response, 'application/json'),
    /expected Content-Type application\/json, received "text\/plain"/,
  );
});

test('rejects missing or narrowed machine-resource CORS', () => {
  for (const allowOrigin of ['', 'https://example.com']) {
    const headers = { 'content-type': 'text/csv; charset=utf-8' };
    if (allowOrigin) headers['access-control-allow-origin'] = allowOrigin;
    const response = new Response('a,b\n', { headers });
    assert.throws(
      () => requireMachineResponseHeaders('entity CSV', response, 'text/csv'),
      /expected Access-Control-Allow-Origin: \*/,
    );
  }
});
