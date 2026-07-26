// Remove fragments that were visibly cut off with a Unicode ellipsis during an earlier content
// import. Keep every complete sentence before and after each broken fragment; never invent the
// missing words. This is a safety net while the original editorial fields are rewritten in full.

function lastSentenceBoundary(text) {
  let boundary = -1;
  for (const match of text.matchAll(/[.!?](?=\s|$)/g)) boundary = match.index;
  return boundary;
}

export function removeTruncatedFragments(value) {
  if (typeof value !== 'string' || !value.includes('…')) return value;
  let remaining = value;
  const complete = [];
  while (remaining.includes('…')) {
    const marker = remaining.indexOf('…');
    const before = remaining.slice(0, marker);
    const boundary = lastSentenceBoundary(before);
    if (boundary >= 0) complete.push(before.slice(0, boundary + 1));
    remaining = remaining.slice(marker + 1).trimStart();
  }
  if (remaining) complete.push(remaining);
  return complete.join(' ').replace(/\s+/g, ' ').replace(/\s+([,.;!?])/g, '$1').trim();
}
