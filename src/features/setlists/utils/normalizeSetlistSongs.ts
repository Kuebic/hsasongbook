/**
 * Normalize setlist songs array, handling legacy arrangementIds format.
 *
 * Frontend version of the same utility for processing Convex data.
 * Returns the songs array in the new format, falling back to converting
 * legacy arrangementIds if needed.
 *
 * @param data - Object with optional songs and arrangementIds fields
 * @returns Normalized array of song entries with arrangementId and optional customKey
 */
export function normalizeSetlistSongs<T extends string>(
  data: {
    songs?: Array<{ arrangementId: T; customKey?: string }>;
    arrangementIds?: T[];
  }
): Array<{ arrangementId: T; customKey?: string }> {
  return (
    data.songs ??
    data.arrangementIds?.map((id) => ({ arrangementId: id })) ??
    []
  );
}
