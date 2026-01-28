import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Prune anonymous users older than 7 days every Sunday at 3:00 AM UTC
crons.weekly(
  "prune anonymous users",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  internal.users.pruneAnonymousUsers
);

// Clean up orphaned R2 files on the 1st of each month at 4:00 AM UTC
// This removes files that are no longer linked to any database record
// (e.g., from failed deletions or database inconsistencies)
crons.monthly(
  "cleanup orphaned R2 files",
  { day: 1, hourUTC: 4, minuteUTC: 0 },
  internal.files.cleanupOrphanedFiles
);

export default crons;
