# Convex Backend

This directory contains the Convex backend configuration for HSA Songbook.

## Files

- `schema.ts` - Database schema definition
- `auth.ts` - Authentication providers (Anonymous + Password)
- `auth.config.ts` - Auth configuration
- `http.ts` - HTTP routes for auth

## First-Time Setup

After cloning the repository:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Convex development server:
   ```bash
   npx convex dev
   ```
   This will create or connect to a Convex deployment and generate TypeScript types.

3. Configure auth environment variables:
   ```bash
   npx @convex-dev/auth
   ```
   This automatically sets up the required environment variables (`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`) in your Convex deployment.

**Note**: If developing on multiple machines, you can either:
- Use the same deployment (environment variables are already configured)
- Create a separate deployment and run `npx @convex-dev/auth` again for that deployment

## Development

Run the Convex dev server:

```bash
npx convex dev
```

This will:
- Watch for changes and auto-deploy
- Generate TypeScript types
- Show logs in the terminal

## Deployment

Deploy to production:

```bash
npx convex deploy
```

## Dashboard

Access the Convex dashboard at: https://dashboard.convex.dev

From the dashboard you can:
- View and edit data
- Monitor function logs
- Manage environment variables
- View auth users

## Auth Providers

Currently configured:
- **Anonymous**: Auto sign-in for offline-first UX
- **Password**: Email/password authentication (no email verification for MVP)

## Adding Database Tables

To add new tables, update `schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Add your tables here
  songs: defineTable({
    title: v.string(),
    artist: v.optional(v.string()),
    // ...
  }),
});
```

Then create query/mutation functions in separate files (e.g., `songs.ts`).
