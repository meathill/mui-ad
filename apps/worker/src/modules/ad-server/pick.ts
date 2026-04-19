/**
 * Weighted random pick. Given a list of candidates with numeric weights,
 * returns one candidate with probability proportional to its weight.
 *
 * - Empty / all-zero weights → returns undefined.
 * - `random` is injectable for deterministic tests.
 */
export function pickWeighted<T>(
  candidates: Array<{ item: T; weight: number }>,
  random: () => number = Math.random,
): T | undefined {
  if (candidates.length === 0) return undefined;

  const total = candidates.reduce((sum, c) => sum + Math.max(0, c.weight), 0);
  if (total <= 0) return undefined;

  let cursor = random() * total;
  for (const c of candidates) {
    cursor -= Math.max(0, c.weight);
    if (cursor <= 0) return c.item;
  }
  return candidates[candidates.length - 1]?.item;
}
