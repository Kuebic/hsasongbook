import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Prune anonymous users older than 7 days every Sunday at 3:00 AM UTC
crons.weekly(
  "prune anonymous users",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  internal.users.pruneAnonymousUsers
);

export default crons;
