# Phase 1: Backend Foundation - Schema & Permissions

## Goal
Establish the database schema and permission infrastructure for setlist privacy and sharing.

## Changes Required

### 1. Update [convex/schema.ts](convex/schema.ts)

**Location:** Lines 124-144 (setlists table)

**Add these new fields to the setlists table:**

```typescript
// Privacy and sharing
privacyLevel: v.union(
  v.literal("private"),   // Default: owner only
  v.literal("unlisted"),  // Shareable via link, not in browse
  v.literal("public")     // Discoverable in browse/search
),

sharedWith: v.optional(
  v.array(
    v.object({
      userId: v.id("users"),
      canEdit: v.boolean(),
      addedBy: v.id("users"),
      addedAt: v.number(),
    })
  )
),

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
```

**Update the indexes (replace existing `.index("by_user", ["userId"])` with):**

```typescript
.index("by_user", ["userId"])
.index("by_privacy", ["privacyLevel"])
.index("by_favorites", ["favorites"])
```

---

### 2. Add Permission Functions to [convex/permissions.ts](convex/permissions.ts)

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

  // Public: anyone can view (including anonymous)
  if (setlist.privacyLevel === "public") return true;

  // Owner always has access
  if (userId && setlist.userId === userId) return true;

  // Check explicit sharing (unlisted or private)
  if (userId && setlist.sharedWith) {
    return setlist.sharedWith.some(share => share.userId === userId);
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

  // Check if shared with edit permission
  if (setlist.sharedWith) {
    const share = setlist.sharedWith.find(s => s.userId === userId);
    return share?.canEdit ?? false;
  }

  return false;
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

**Update the `create` mutation to set default privacy:**

Find the `create` mutation and add these fields to the `ctx.db.insert()` call:
```typescript
privacyLevel: "private",  // Default to private
favorites: 0,
showAttribution: false,
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
