// Unit tests for the safety-critical robots.txt logic in http.mjs.
// Run: node --test  (from pipeline/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots, pathAllowed, USER_AGENT } from './http.mjs';

const UA = 'DataMoatEngineBot';

test('honest UA carries bot name and contact placeholder', () => {
  assert.ok(USER_AGENT.includes('DataMoatEngineBot'));
  assert.ok(USER_AGENT.includes('<<OWNER_PROVIDES>>'));
});

test('empty robots => everything allowed', () => {
  const g = parseRobots('');
  assert.equal(pathAllowed(g, UA, '/anything'), true);
});

test('global disallow of a subtree blocks it but allows siblings', () => {
  const g = parseRobots(`User-agent: *\nDisallow: /private/`);
  assert.equal(pathAllowed(g, UA, '/private/secret'), false);
  assert.equal(pathAllowed(g, UA, '/public/data'), true);
});

test('Disallow: / blocks the whole site', () => {
  const g = parseRobots(`User-agent: *\nDisallow: /`);
  assert.equal(pathAllowed(g, UA, '/'), false);
  assert.equal(pathAllowed(g, UA, '/data/rates.csv'), false);
});

test('empty Disallow means allow-all', () => {
  const g = parseRobots(`User-agent: *\nDisallow:`);
  assert.equal(pathAllowed(g, UA, '/anything'), true);
});

test('most specific rule wins: Allow overrides a broader Disallow', () => {
  const g = parseRobots(
    `User-agent: *\nDisallow: /data/\nAllow: /data/public/`
  );
  assert.equal(pathAllowed(g, UA, '/data/private/x'), false);
  assert.equal(pathAllowed(g, UA, '/data/public/x'), true);
});

test('UA-specific group takes precedence over *', () => {
  const g = parseRobots(
    `User-agent: *\nDisallow: /\n\nUser-agent: DataMoatEngineBot\nDisallow: /admin/`
  );
  // Our UA group allows everything except /admin/, ignoring the '*' blanket block.
  assert.equal(pathAllowed(g, UA, '/data/x'), true);
  assert.equal(pathAllowed(g, UA, '/admin/x'), false);
});

test('wildcard and end-anchor patterns', () => {
  const g = parseRobots(`User-agent: *\nDisallow: /*.pdf$`);
  assert.equal(pathAllowed(g, UA, '/reports/a.pdf'), false);
  assert.equal(pathAllowed(g, UA, '/reports/a.pdf?x=1'), true); // $ anchors end
  assert.equal(pathAllowed(g, UA, '/reports/a.html'), true);
});

test('comments and blank lines are ignored', () => {
  const g = parseRobots(
    `# comment\nUser-agent: *   # inline\nDisallow: /x/ # blocked\n\n`
  );
  assert.equal(pathAllowed(g, UA, '/x/y'), false);
  assert.equal(pathAllowed(g, UA, '/y'), true);
});
