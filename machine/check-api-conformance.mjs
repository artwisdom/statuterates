#!/usr/bin/env node
// Validate every generated JSON/CSV response against the executable OpenAPI 3.1 contract and the
// cross-file legal/data invariants that JSON Schema cannot express. Run after build-api.mjs.

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateGeneratedApi } from './api-contract.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const result = validateGeneratedApi({
  apiDir: resolve(__dirname, '..', 'site', 'public', 'api', 'v1'),
  openapiPath: resolve(__dirname, 'openapi.yaml'),
});

if (result.errors.length) {
  console.error(`API CONFORMANCE FAILED (${result.errors.length}):`);
  for (const error of result.errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log(
  `API conformance OK: ${result.entityCount} JSON+CSV entity pairs and `
  + `${result.observationCount} unique recorded observations validated against OpenAPI 3.1 and cross-file semantics.`,
);
