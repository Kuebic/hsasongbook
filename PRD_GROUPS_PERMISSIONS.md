# PRD: Groups, Permissions & Collaborative Ownership

## Overview

This feature introduces a comprehensive permissions and groups system for HSA Songbook, enabling:
1. **Owner-only editing** with collaborator support for arrangements
2. **Groups** that can own songs and arrangements with role-based access
3. **A single "Public" system group** for crowdsourced content with full version history

## User Stories

### Phase 1: Collaborators
- As an arrangement owner, I can add collaborators who can edit my arrangement
- As a collaborator, I can edit arrangements I've been invited to
- As a viewer, I cannot edit arrangements I don't own or collaborate on

### Phase 2: Groups
- As a user, I can create a group and invite members
- As a group admin, I can approve/reject join requests
- As a group member, I can post arrangements under the group's name
- As a user, I can see arrangements "By LA Band" with co-authors shown in details
- As a Public group member, I can edit any Public-owned song (with version history)

---

## Phase 1: Owner-only Editing + Collaborators

### 1.1 Schema Changes

**File: `convex/schema.ts`**

```typescript
arrangementCollaborators: defineTable({
  arrangementId: v.id("arrangements"),
  userId: v.id("users"),
  addedBy: v.id("users"),
  addedAt: v.number(),
})
  .index("by_arrangement", ["arrangementId"])
  .index("by_user", ["userId"])
  .index("by_arrangement_and_user", ["arrangementId", "userId"]),
```

### 1.2 Backend Changes

**New file: `convex/permissions.ts`**
- `canEditArrangement(ctx, arrangementId, userId)` - Returns true if owner or collaborator
- `isArrangementOwner(ctx, arrangementId, userId)` - Returns true if owner

**Update: `convex/arrangements.ts`**
- Add `canEdit` query - Check if current user can edit
- Add `getCollaborators` query - Get collaborators for an arrangement (owner only)
- Add `addCollaborator` mutation - Add a collaborator (owner only)
- Add `removeCollaborator` mutation - Remove a collaborator (owner only)
- Update `update` mutation - Use `canEditArrangement()` instead of direct owner check

### 1.3 Frontend Changes

**New file: `src/features/arrangements/hooks/useArrangementPermissions.ts`**
```typescript
export function useArrangementPermissions(arrangementId: string | null) {
  // Returns { canEdit, isOwner, isCollaborator, loading }
}
```

**Update: `src/features/arrangements/pages/ArrangementPage.tsx`**
- Import and use `useArrangementPermissions`
- Pass `editable={canEdit}` to `ChordProViewer` instead of `editable={true}`
- Only show edit controls when `canEdit === true`

**New file: `src/features/arrangements/components/CollaboratorsDialog.tsx`**
- Dialog for managing collaborators (owner only sees "Manage Collaborators" button)
- Search users by username
- Add/remove collaborators
- Uses shadcn/ui Dialog pattern

**New file: `src/features/arrangements/components/CollaboratorsList.tsx`**
- Display list of collaborators with avatars
- Show in arrangement details view

---

## Phase 2: Groups with Ownership

### 2.1 Schema Changes

**File: `convex/schema.ts`**

```typescript
// Groups
groups: defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  avatarKey: v.optional(v.string()),
  createdBy: v.id("users"),
  joinPolicy: v.union(v.literal("open"), v.literal("approval")),
  isSystemGroup: v.optional(v.boolean()),
})
  .index("by_slug", ["slug"])
  .index("by_createdBy", ["createdBy"]),

// Group Membership (with hierarchical admin seniority)
groupMembers: defineTable({
  groupId: v.id("groups"),
  userId: v.id("users"),
  role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  joinedAt: v.number(),
  promotedAt: v.optional(v.number()), // When promoted to admin (for seniority)
  invitedBy: v.optional(v.id("users")),
})
  .index("by_group", ["groupId"])
  .index("by_user", ["userId"])
  .index("by_group_and_user", ["groupId", "userId"])
  .index("by_group_and_role", ["groupId", "role"]),

// Join Requests (for approval-required groups)
groupJoinRequests: defineTable({
  groupId: v.id("groups"),
  userId: v.id("users"),
  status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  requestedAt: v.number(),
  resolvedBy: v.optional(v.id("users")),
  resolvedAt: v.optional(v.number()),
})
  .index("by_group", ["groupId"])
  .index("by_user", ["userId"])
  .index("by_group_and_status", ["groupId", "status"]),

// Arrangement Co-authors (display attribution, also grants edit rights)
arrangementAuthors: defineTable({
  arrangementId: v.id("arrangements"),
  userId: v.id("users"),
  isPrimary: v.boolean(),
  addedAt: v.number(),
})
  .index("by_arrangement", ["arrangementId"])
  .index("by_user", ["userId"]),

// Version History (Public group content only)
contentVersions: defineTable({
  contentType: v.union(v.literal("song"), v.literal("arrangement")),
  contentId: v.string(),
  version: v.number(),
  snapshot: v.string(), // JSON snapshot
  changedBy: v.id("users"),
  changedAt: v.number(),
  changeDescription: v.optional(v.string()),
})
  .index("by_content", ["contentType", "contentId"])
  .index("by_content_and_version", ["contentType", "contentId", "version"]),
```

**Update songs and arrangements tables:**
```typescript
// Add to both songs and arrangements:
ownerType: v.optional(v.union(v.literal("user"), v.literal("group"))),
ownerId: v.optional(v.string()), // userId or groupId
// Keep createdBy for original creator attribution
```

### 2.2 Backend: Groups API

**New file: `convex/groups.ts`**

Queries:
- `list()` - Get all groups (with membership status for current user)
- `get({ id })` - Get group by ID
- `getBySlug({ slug })` - Get group by slug
- `getMembers({ groupId })` - Get members with roles
- `getPendingRequests({ groupId })` - Get pending join requests (admin/owner)
- `getPublicGroup()` - Get the system "Public" group
- `getUserGroups()` - Get groups current user belongs to

Mutations:
- `create({ name, description, joinPolicy })` - Create group
- `update({ id, name, description, joinPolicy })` - Update group
- `delete({ id })` - Delete group (owner only)
- `requestJoin({ groupId })` - Request to join
- `cancelRequest({ groupId })` - Cancel pending request
- `approveJoin({ requestId })` - Approve request (admin/owner)
- `rejectJoin({ requestId })` - Reject request (admin/owner)
- `removeMember({ groupId, userId })` - Remove member (only if senior to target)
- `demoteAdmin({ groupId, userId })` - Demote admin to member (only if senior)
- `promoteToAdmin({ groupId, userId })` - Promote member to admin (any admin can do this; new admin becomes junior)
- `leaveGroup({ groupId })` - Leave a group (auto-promotes next senior admin to owner if owner leaves)
- `transferOwnership({ groupId, userId })` - Transfer ownership to another member

### 2.3 Backend: Version History API

**New file: `convex/versions.ts`**

Queries:
- `getHistory({ contentType, contentId, limit? })` - Get version history **(Public group owner/admin only)**
- `getVersion({ contentType, contentId, version })` - Get specific version **(Public group owner/admin only)**

Mutations:
- `createVersion({ contentType, contentId, snapshot, description? })` - Internal (auto-called on save)
- `rollback({ contentType, contentId, version })` - Rollback to version **(Public group owner/admin only)**

> **Note:** Version history is only visible to and actionable by Public group owner/admins for moderation purposes. Regular members can edit but cannot view history or rollback.

### 2.4 Backend: Updated Permissions

**Update: `convex/permissions.ts`**

```typescript
// Unified permission check for songs and arrangements
async function canEditContent(ctx, contentType, contentId, userId): Promise<boolean> {
  // 1. If ownerType='user': check owner or collaborator/co-author
  // 2. If ownerType='group':
  //    - For Public group: any member can edit
  //    - For other groups: owner/admin can edit, members if co-author
}
```

### 2.5 Frontend: Groups Feature Module

**New directory: `src/features/groups/`**

```
src/features/groups/
├── components/
│   ├── GroupCard.tsx           # Group preview in list
│   ├── GroupHeader.tsx         # Group page header
│   ├── GroupMemberList.tsx     # Members with role badges
│   ├── GroupJoinButton.tsx     # Join/Leave/Request button
│   ├── JoinRequestList.tsx     # Admin: pending requests
│   ├── CreateGroupDialog.tsx   # Create new group
│   └── GroupSettingsForm.tsx   # Edit group settings
├── pages/
│   ├── GroupsIndexPage.tsx     # Browse/discover groups
│   ├── GroupPage.tsx           # Single group view
│   └── GroupSettingsPage.tsx   # Group settings (owner)
├── hooks/
│   ├── useGroupData.ts
│   ├── useGroupMembership.ts
│   └── useGroupPermissions.ts
├── validation/
│   └── groupSchemas.ts         # Zod schemas
└── index.ts
```

### 2.6 Frontend: Version History Components

**New directory: `src/features/versions/`**

```
src/features/versions/
├── components/
│   ├── VersionHistoryList.tsx    # List versions with timestamps
│   ├── VersionDiff.tsx           # Show changes between versions
│   └── RollbackConfirmDialog.tsx # Confirm rollback
├── hooks/
│   └── useVersionHistory.ts
└── index.ts
```

### 2.7 UI Updates for Group Ownership

**Update: `src/features/arrangements/components/ArrangementCard.tsx`**
- Show "By LA Band" when `ownerType === 'group'`
- Link to group page instead of user profile

**Update: `src/features/arrangements/pages/ArrangementPage.tsx`**
- Show co-authors in details section
- Add version history panel for Public-owned content

**Update: `src/features/songs/pages/SongPage.tsx`**
- Show group ownership badge
- Version history for Public songs

**New: Song/Arrangement creation forms**
- Add owner selector: "Post as myself" or "Post as [group]"
- Add co-author picker (for group posts)

### 2.8 Routes

Add to router:
- `/groups` - Groups index
- `/groups/:slug` - Group page
- `/groups/:slug/settings` - Group settings

---

## Migration Strategy

1. **Schema migration is additive** - new fields are optional
2. **Run migration script** to set `ownerType='user'` and `ownerId=createdBy` for existing content
3. **Seed Public group** via `npx convex run seed:seedPublicGroup`

**Migration script: `convex/migrations/addOwnership.ts`**
```typescript
export const migrateOwnership = mutation({
  handler: async (ctx) => {
    // Set ownerType='user', ownerId=createdBy for all existing songs/arrangements
  },
});
```

---

## Display Rules

| Scenario | Card Display | Details Display |
|----------|--------------|-----------------|
| User owns arrangement | "By @username" | "Arranged by @username" |
| Group owns arrangement | "By Group Name" | "Arranged by Group Name" + co-authors list |
| User owns song | "Added by @username" | "Added by @username" (link to profile) |
| Group owns song | "By Group Name" | "By Group Name" (link to group page) |
| Public owns song | "Public" badge | "Public (Crowdsourced)" badge + edit for members |
| Public owns arrangement | "Public" badge | "Public (Crowdsourced)" + version history for admins |

---

## Hierarchical Admin System (Reddit-style)

Admins have seniority based on when they were promoted (`promotedAt` timestamp). This affects:

### Seniority Rules
1. **Owner** is always most senior
2. **Admins** are ranked by `promotedAt` (earlier = more senior)
3. An admin can only demote/remove admins who were promoted **after** them
4. An admin cannot demote/remove admins who are senior to them
5. **Any admin can promote a member to admin** - the new admin's `promotedAt` is set to now, making them junior to all existing admins

### Owner Succession
When an owner leaves a group:
1. The **oldest admin** (earliest `promotedAt`) automatically becomes the new owner
2. If no admins exist, the **oldest member** (earliest `joinedAt`) becomes owner
3. If no members exist, the group is deleted (or orphaned for system groups)

### Permission Checks for Admin Actions
```typescript
function canManageMember(actor, target, group): boolean {
  if (actor.role === 'owner') return true;
  if (actor.role !== 'admin') return false;
  if (target.role === 'owner') return false;
  if (target.role === 'member') return true;
  // Both are admins - check seniority
  return actor.promotedAt < target.promotedAt;
}
```

---

## Permission Matrix

### Content Permissions
| Action | User Owner | Collaborator | Co-author | Group Member | Group Admin | Group Owner |
|--------|------------|--------------|-----------|--------------|-------------|-------------|
| View | Yes | Yes | Yes | Yes | Yes | Yes |
| Edit arrangement | Yes | Yes | Yes | Public only | Yes | Yes |
| Edit song | Yes | - | - | Public only | Yes | Yes |
| Add collaborators | Yes | No | No | No | Yes | Yes |
| Delete | Yes | No | No | No | No | Yes |

### Version History Permissions (Public Group Only)
| Action | Group Member | Group Admin | Group Owner |
|--------|--------------|-------------|-------------|
| Edit Public content | Yes | Yes | Yes |
| View version history | No | Yes | Yes |
| Rollback versions | No | Yes | Yes |

### Group Management Permissions
| Action | Member | Admin | Senior Admin | Owner |
|--------|--------|-------|--------------|-------|
| Leave group | Yes | Yes | Yes | Yes* |
| View members | Yes | Yes | Yes | Yes |
| Approve join requests | No | Yes | Yes | Yes |
| Remove members | No | Yes | Yes | Yes |
| Demote junior admins | No | No | Yes | Yes |
| Promote to admin | No | Yes | Yes | Yes |
| Remove senior admins | No | No | No | Yes |
| Edit group settings | No | No | No | Yes |
| Delete group | No | No | No | Yes |
| Transfer ownership | No | No | No | Yes |

*Owner leaving triggers automatic succession

---

## Implementation Order

### Phase 1 (Collaborators)
1. Add `arrangementCollaborators` table to schema
2. Create `convex/permissions.ts`
3. Add collaborator queries/mutations to `convex/arrangements.ts`
4. Update arrangement `update` mutation to use permission check
5. Create `useArrangementPermissions` hook
6. Update `ArrangementPage.tsx` to gate editing
7. Create `CollaboratorsDialog.tsx` and `CollaboratorsList.tsx`

### Phase 2 (Groups)
8. Add groups tables to schema
9. Add ownership fields to songs/arrangements
10. Create migration script and run it
11. Create `convex/groups.ts` API
12. Create groups feature module (pages, components, hooks)
13. Update ArrangementCard and ArrangementPage for group display
14. Add owner selector to create forms
15. Add routes for groups pages

### Phase 2b (Version History)
16. Add `contentVersions` table
17. Create `convex/versions.ts` API
18. Hook version creation into save flow for Public content
19. Create version history UI components
20. Seed Public group

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `convex/schema.ts` | Add all new tables |
| `convex/arrangements.ts` | Add collaborator mutations, update permission check |
| `convex/songs.ts` | Update permission check for group ownership |
| `convex/permissions.ts` | New file - centralized permission logic |
| `convex/groups.ts` | New file - groups API |
| `convex/versions.ts` | New file - version history API |
| `src/features/arrangements/pages/ArrangementPage.tsx` | Gate editing, show co-authors |
| `src/features/arrangements/components/ArrangementCard.tsx` | Group ownership display |
| `src/App.tsx` or router file | Add group routes |

---

## Open Questions Resolved

| Question | Answer |
|----------|--------|
| Public group membership | Opt-in with admin approval |
| Version history scope | Public content only, full snapshots |
| Version history access | Public group owner/admins only (for moderation) |
| Group ownership scope | Both songs and arrangements |
| Who creates groups | Any authenticated user |
| Co-author edit rights | Yes, co-authors can edit |
| Author display format | "By LA Band" on cards; co-authors in details only |
| Group roles | Owner > Admin > Member (with seniority for admins) |
| Join policy | Configurable per group (open or approval) |
| Admin hierarchy | Reddit-style: admins can only manage juniors (by promotedAt) |
| Owner succession | Auto-promote oldest admin, then oldest member |
