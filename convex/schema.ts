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
    displayName: v.optional(v.string()),
    avatarKey: v.optional(v.string()), // R2 object key for profile picture
  })
    .index("email", ["email"])
    .index("by_displayName", ["displayName"]),

  // Songs - Global community library
  // Read: Everyone | Write: Authenticated users only
  songs: defineTable({
    title: v.string(),
    artist: v.optional(v.string()),
    themes: v.array(v.string()),
    copyright: v.optional(v.string()),
    lyrics: v.optional(v.string()),
    slug: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_slug", ["slug"])
    .index("by_title", ["title"])
    .index("by_createdBy", ["createdBy"]),

  // Arrangements - User-owned versions of songs
  // Read: Everyone | Write: Creator only
  arrangements: defineTable({
    songId: v.id("songs"),
    name: v.string(),
    key: v.optional(v.string()),
    tempo: v.optional(v.number()),
    capo: v.optional(v.number()),
    timeSignature: v.optional(v.string()),
    chordProContent: v.string(),
    slug: v.string(),
    createdBy: v.id("users"),
    // Social fields
    rating: v.number(),
    favorites: v.number(),
    tags: v.array(v.string()),
    // Track edits
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_song", ["songId"])
    .index("by_createdBy", ["createdBy"]),

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
});
