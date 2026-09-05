/**
 * "Recently added" (ledger §11.1): derived from confirmed meal entries only — never from
 * items that were merely viewed, and never from seeded records. Newest first, one row
 * per candidate identity (adding the same food again moves it to the top), across every
 * day the record holds. Cancelled drafts never become entries, so they never appear.
 */
import type { FoodCandidate } from './calculation';
import type { FoodEntry } from './daily-log';

/** The most recent entries shown as recents; older history stays searchable through the catalogue. */
export const RECENTS_LIMIT = 8;

export function recentCandidates(entries: readonly FoodEntry[], limit = RECENTS_LIMIT): FoodCandidate[] {
  const byNewest = [...entries].sort((a, b) => b.createdAt - a.createdAt);
  const seen = new Set<string>();
  const result: FoodCandidate[] = [];
  for (const entry of byNewest) {
    const id = entry.candidate.id;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(entry.candidate);
    if (result.length >= limit) break;
  }
  return result;
}
