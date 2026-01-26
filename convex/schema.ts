import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  // Override users table to add custom fields
  users: defineTable({
    // Auth fields (from @convex-dev/auth)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    username: v.optional(v.string()), // Unique public username (required for non-anonymous)
    displayName: v.optional(v.string()), // Optional "real name" shown on contributions
    avatarKey: v.optional(v.string()), // R2 object key for profile picture
    showRealName: v.optional(v.boolean()), // Toggle to show displayName instead of username
  })
    .index("email", ["email"])
    .index("by_username", ["username"])
    .index("by_displayName", ["displayName"]),

  // Songs - Global community library
  // Read: Everyone | Write: Authenticated users only (or group members for group-owned)
  songs: defineTable({
    title: v.string(),
    artist: v.optional(v.string()),
    themes: v.array(v.string()),
    copyright: v.optional(v.string()),
    lyrics: v.optional(v.string()),
    origin: v.optional(v.string()), // Song origin category (e.g., traditional-holy-songs, new-holy-songs)
    slug: v.string(),
    createdBy: v.id("users"),
    // Ownership (Phase 2) - defaults to user ownership
    ownerType: v.optional(v.union(v.literal("user"), v.literal("group"))),
    ownerId: v.optional(v.string()), // userId or groupId as string
    // Track edits
    updatedAt: v.optional(v.number()),
    // Denormalized arrangement summary (updated by arrangement mutations)
    arrangementCount: v.optional(v.number()),
    arrangementKeys: v.optional(v.array(v.string())),
    arrangementTempoMin: v.optional(v.number()),
    arrangementTempoMax: v.optional(v.number()),
    arrangementDifficulties: v.optional(
      v.array(
        v.union(v.literal("simple"), v.literal("standard"), v.literal("advanced"))
      )
    ),
    arrangementTotalFavorites: v.optional(v.number()),
    // Direct song favorites count
    favorites: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_title", ["title"])
    .index("by_createdBy", ["createdBy"])
    .index("by_owner", ["ownerType", "ownerId"])
    .index("by_arrangementCount", ["arrangementCount"]),

  // Arrangements - User-owned versions of songs
  // Read: Everyone | Write: Creator, collaborators, or group members (for group-owned)
  arrangements: defineTable({
    songId: v.id("songs"),
    name: v.string(),
    key: v.optional(v.string()),
    tempo: v.optional(v.number()),
    capo: v.optional(v.number()),
    timeSignature: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("simple"), v.literal("standard"), v.literal("advanced"))
    ),
    chordProContent: v.string(),
    slug: v.string(),
    createdBy: v.id("users"),
    // Social fields
    favorites: v.number(),
    tags: v.array(v.string()),
    // Track edits
    updatedAt: v.optional(v.number()),
    // Ownership (Phase 2) - defaults to user ownership
    ownerType: v.optional(v.union(v.literal("user"), v.literal("group"))),
    ownerId: v.optional(v.string()), // userId or groupId as string
    // Audio references
    audioFileKey: v.optional(v.string()), // R2 object key for MP3 file
    youtubeUrl: v.optional(v.string()), // YouTube video URL or ID
  })
    .index("by_slug", ["slug"])
    .index("by_song", ["songId"])
    .index("by_createdBy", ["createdBy"])
    .index("by_owner", ["ownerType", "ownerId"])
    .index("by_favorites", ["favorites"]),

  // Setlists - Private to user
  // Read: Owner only | Write: Owner only
  setlists: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    performanceDate: v.optional(v.string()),
    arrangementIds: v.array(v.id("arrangements")),
    userId: v.id("users"),
    // Track edits
    updatedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Arrangement Collaborators - Users who can edit arrangements they don't own
  arrangementCollaborators: defineTable({
    arrangementId: v.id("arrangements"),
    userId: v.id("users"),
    addedBy: v.id("users"),
    addedAt: v.number(),
  })
    .index("by_arrangement", ["arrangementId"])
    .index("by_user", ["userId"])
    .index("by_arrangement_and_user", ["arrangementId", "userId"]),

  // ============ PHASE 2: GROUPS ============

  // Groups - Collections of users with shared ownership
  groups: defineTable({
    name: v.string(),
    slug: v.string(), // URL-friendly unique identifier
    description: v.optional(v.string()),
    avatarKey: v.optional(v.string()), // R2 object key for group avatar
    createdBy: v.id("users"),
    joinPolicy: v.union(v.literal("open"), v.literal("approval")),
    isSystemGroup: v.optional(v.boolean()), // True for "Community" group
  })
    .index("by_slug", ["slug"])
    .index("by_createdBy", ["createdBy"])
    .index("by_isSystemGroup", ["isSystemGroup"]),

  // Group Membership - With hierarchical admin seniority (Reddit-style)
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

  // Join Requests - For approval-required groups
  groupJoinRequests: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    requestedAt: v.number(),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_and_status", ["groupId", "status"]),

  // Arrangement Co-authors - Display attribution + edit rights for group-owned content
  arrangementAuthors: defineTable({
    arrangementId: v.id("arrangements"),
    userId: v.id("users"),
    isPrimary: v.boolean(), // Primary author shown first
    addedAt: v.number(),
  })
    .index("by_arrangement", ["arrangementId"])
    .index("by_user", ["userId"]),

  // Version History - For Public group content (wiki-style moderation)
  contentVersions: defineTable({
    contentType: v.union(v.literal("song"), v.literal("arrangement")),
    contentId: v.string(), // songId or arrangementId as string
    version: v.number(),
    snapshot: v.string(), // JSON snapshot of the content
    changedBy: v.id("users"),
    changedAt: v.number(),
    changeDescription: v.optional(v.string()),
  })
    .index("by_content", ["contentType", "contentId"])
    .index("by_content_and_version", ["contentType", "contentId", "version"]),

  // User Favorites - Track what users have favorited (songs and arrangements)
  userFavorites: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("song"), v.literal("arrangement")),
    targetId: v.string(), // songId or arrangementId as string
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "targetType"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_user_and_target", ["userId", "targetType", "targetId"]),
});
