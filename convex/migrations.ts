/**
 * Database Migrations
 *
 * One-time scripts to migrate data. Run via:
 *   npx convex run migrations:backfillArrangementSummary
 */

import { internalMutation } from "./_generated/server";

/**
 * Backfill arrangement summary fields on all songs.
 *
 * This should be run once after deploying the schema changes that added
 * denormalized arrangement fields to the songs table.
 *
 * Run with: npx convex run migrations:backfillArrangementSummary
 */
export const backfillArrangementSummary = internalMutation({
  args: {},
  handler: async (ctx) => {
    const songs = await ctx.db.query("songs").collect();
    let updated = 0;

    for (const song of songs) {
      const arrangements = await ctx.db
        .query("arrangements")
        .withIndex("by_song", (q) => q.eq("songId", song._id))
        .collect();

      // Extract unique keys
      const keys = [
        ...new Set(
          arrangements.map((a) => a.key).filter((k): k is string => Boolean(k))
        ),
      ];

      // Extract tempos
      const tempos = arrangements
        .map((a) => a.tempo)
        .filter((t): t is number => t !== undefined && t !== null);

      // Extract unique difficulties
      const difficulties = [
        ...new Set(
          arrangements
            .map((a) => a.difficulty)
            .filter(
              (d): d is "simple" | "standard" | "advanced" => d !== undefined
            )
        ),
      ];

      // Calculate ratings and favorites
      const ratings = arrangements.map((a) => a.rating || 0);
      const totalFavorites = arrangements.reduce(
        (sum, a) => sum + (a.favorites || 0),
        0
      );
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      await ctx.db.patch(song._id, {
        arrangementCount: arrangements.length,
        arrangementKeys: keys,
        arrangementTempoMin: tempos.length > 0 ? Math.min(...tempos) : undefined,
        arrangementTempoMax: tempos.length > 0 ? Math.max(...tempos) : undefined,
        arrangementDifficulties:
          difficulties.length > 0 ? difficulties : undefined,
        arrangementAvgRating: avgRating,
        arrangementTotalFavorites: totalFavorites,
      });

      updated++;
    }

    return { success: true, songsUpdated: updated };
  },
});
