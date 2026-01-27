# Phase 1: Backend Foundation - Schema & Permissions

## Goal
Establish the database schema and permission infrastructure for setlist privacy and sharing.

## Changes Required

### 1. Update [convex/schema.ts](convex/schema.ts)

**Location:** Lines 124-144 (setlists table)

**Add these new fields to the setlists table:**

```typescript
// Privacy level (optional for backward compatibility - treat undefined as "private")
privacyLevel: v.optional(v.union(
  v.literal("private"),   // Default: owner only
  v.literal("unlisted"),  // Shareable via link, not in browse
  v.literal("public")     // Discoverable in browse/search
)),

// Discoverability metadata
tags: v.optional(v.array(v.string())),
estimatedDuration: v.optional(v.number()),  // Minutes
difficulty: v.optional(v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced")
)),

// Attribution for duplicates
duplicatedFrom: v.optional(v.id("setlists")),
duplicatedFromName: v.optional(v.string()),
showAttribution: v.optional(v.boolean()),

// Denormalized favorites counter
favorites: v.optional(v.number()),

// Timestamps
createdAt: v.optional(v.number()),
```

**IMPORTANT:** `privacyLevel` is optional so existing setlists don't break. In all queries, treat `undefined` as `"private"`.

**Add NEW table for sharing (separate from setlists for efficient queries):**

```typescript
// Sharing relationships - separate table for efficient "shared with me" queries
setlistShares: defineTable({
  setlistId: v.id("setlists"),
  userId: v.id("users"),      // The user being shared with
  canEdit: v.boolean(),
  addedBy: v.id("users"),     // Who granted access
  addedAt: v.number(),
})
  .index("by_user", ["userId"])           // Query: "setlists shared with me"
  .index("by_setlist", ["setlistId"])     // Query: "who has access to this setlist"
  .index("by_user_setlist", ["userId", "setlistId"]),  // Check specific access
```

**Update the setlists indexes:**

```typescript
.index("by_user", ["userId"])
.index("by_privacy", ["privacyLevel"])
// Note: by_favorites index removed - Convex indexes are for equality, not sorting
```

---

### 2. Add Permission Functions to [convex/permissions.ts](convex/permissions.ts)

**Add these imports at the top:**

```typescript
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
```

**Add these three new functions at the end of the file:**

```typescript
/**
 * Check if a user can view a setlist based on privacy level and sharing
 */
export async function canViewSetlist(
  ctx: QueryCtx | MutationCtx,
  setlistId: Id<"setlists">,
  userId: Id<"users"> | null
): Promise<boolean> {
  const setlist = await ctx.db.get(setlistId);
  if (!setlist) return false;

  // Treat undefined privacyLevel as "private" (backward compatibility)
  const privacyLevel = setlist.privacyLevel ?? "private";

  // Public: anyone can view (including anonymous)
  if (privacyLevel === "public") return true;

  // Unlisted: anyone with the link can view (no auth required)
  if (privacyLevel === "unlisted") return true;

  // Private: owner or explicitly shared users only
  if (userId && setlist.userId === userId) return true;

  // Check explicit sharing via setlistShares table
  if (userId) {
    const share = await ctx.db
      .query("setlistShares")
      .withIndex("by_user_setlist", q =>
        q.eq("userId", userId).eq("setlistId", setlistId)
      )
      .first();
    if (share) return true;
  }

  return false;
}

/**
 * Check if a user can edit a setlist (owner or shared with edit permission)
 */
export async function canEditSetlist(
  ctx: QueryCtx | MutationCtx,
  setlistId: Id<"setlists">,
  userId: Id<"users">
): Promise<boolean> {
  const setlist = await ctx.db.get(setlistId);
  if (!setlist) return false;

  // Owner can always edit
  if (setlist.userId === userId) return true;

  // Check if shared with edit permission via setlistShares table
  const share = await ctx.db
    .query("setlistShares")
    .withIndex("by_user_setlist", q =>
      q.eq("userId", userId).eq("setlistId", setlistId)
    )
    .first();

  return share?.canEdit ?? false;
}

/**
 * Check if a user can change a setlist's privacy level (owner only)
 */
export async function canChangeSetlistPrivacy(
  ctx: QueryCtx | MutationCtx,
  setlistId: Id<"setlists">,
  userId: Id<"users">
): Promise<boolean> {
  const setlist = await ctx.db.get(setlistId);
  if (!setlist) return false;

  // ONLY owner can change privacy level
  return setlist.userId === userId;
}
```

---

### 3. Update [convex/setlists.ts](convex/setlists.ts) - Existing Queries

**Update the `create` mutation to set default values:**

Find the `create` mutation and add these fields to the `ctx.db.insert()` call:
```typescript
privacyLevel: "private",  // Default to private
favorites: 0,
showAttribution: false,
createdAt: Date.now(),
```

**Update the `get()` query to check permissions:**

Replace the handler with:
```typescript
handler: async (ctx, args) => {
  const userId = await getAuthUserId(ctx);
  const setlist = await ctx.db.get(args.id);

  if (!setlist) return null;

  // Check view permission
  const canView = await canViewSetlist(ctx, args.id, userId);
  if (!canView) return null;

  return setlist;
},
```

**Update the `update()` mutation to check edit permissions:**

Add this check at the start of the handler (after getting userId and setlist):
```typescript
const canEdit = await canEditSetlist(ctx, args.id, userId);
if (!canEdit) {
  throw new Error("You don't have permission to edit this setlist");
}
```

**Update the `remove()` mutation:**

Keep existing owner check (it's already correct - only owner can delete).

**Update other mutations (`addArrangement`, `updateSongKey`):**

Add the same edit permission check:
```typescript
const canEdit = await canEditSetlist(ctx, args.setlistId, userId);
if (!canEdit) {
  throw new Error("You don't have permission to edit this setlist");
}
```

---

### 4. Create Data Migration [convex/migrations.ts](convex/migrations.ts)

**Create new file if it doesn't exist:**

```typescript
import { internalMutation } from "./_generated/server";

/**
 * Migrate existing setlists to add privacy fields
 * Run once via Convex dashboard after schema deployment
 */
export const migrateSetlistsToPrivacy = internalMutation({
  handler: async (ctx) => {
    const setlists = await ctx.db.query("setlists").collect();

    let migratedCount = 0;

    for (const setlist of setlists) {
      // Only update if privacyLevel doesn't exist
      if (!setlist.privacyLevel) {
        await ctx.db.patch(setlist._id, {
          privacyLevel: "private",  // Default existing setlists to private
          favorites: 0,
          showAttribution: false,
          tags: [],
        });
        migratedCount++;
      }
    }

    return { total: setlists.length, migrated: migratedCount };
  },
});
```

---

## Testing Steps

1. **Schema Deployment:**
   - Run `npx convex dev` to deploy schema changes
   - Verify no errors in Convex dashboard

2. **Run Migration:**
   - Go to Convex dashboard → Functions → Internal
   - Run `migrations:migrateSetlistsToPrivacy`
   - Verify all existing setlists now have `privacyLevel: "private"`

3. **Test Permission Functions:**
   - Create a new setlist → should have `privacyLevel: "private"`
   - Try accessing via `get()` query → owner should see it, others shouldn't
   - Update existing functions to ensure edit checks work

4. **Type Check:**
   - Run `npm run typecheck` to ensure no TypeScript errors

---

## Dependencies
None - this is the foundation phase.

## Next Phase
Phase 2: Core Sharing Mutations (add sharing functionality)
