/**
 * Attachment management for arrangements
 *
 * Handles file attachments (PDFs, music notation files, images, documents)
 * stored in R2 and linked to arrangements.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { requireAuth, canEditArrangement } from "./permissions";

const r2 = new R2(components.r2);

// ============ CONSTANTS ============

export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

// MIME types allowed for attachments
export const ALLOWED_ATTACHMENT_TYPES = [
  // PDFs
  "application/pdf",
  // Music notation formats
  "application/x-dorico", // .dorico
  "application/x-finale", // .musx, .mus
  "application/x-sibelius", // .sib
  "application/vnd.recordare.musicxml", // .musicxml
  "application/vnd.recordare.musicxml+xml",
  "text/xml", // .xml (MusicXML)
  "application/xml",
  "audio/midi", // .mid, .midi
  "audio/x-midi",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain", // .txt
  // Allow octet-stream for music files that browsers don't recognize
  "application/octet-stream",
];

// ============ MUTATIONS ============

/**
 * Add a file attachment to an arrangement
 * Called after successful R2 upload
 * Access: Arrangement owner or collaborators
 */
export const addAttachment = mutation({
  args: {
    arrangementId: v.id("arrangements"),
    key: v.string(),
    displayName: v.string(),
    originalName: v.string(),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check edit permission
    const hasPermission = await canEditArrangement(
      ctx,
      args.arrangementId,
      userId
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to edit this arrangement");
    }

    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    const currentAttachments = arrangement.attachments ?? [];

    // Check attachment limit
    if (currentAttachments.length >= MAX_ATTACHMENTS) {
      // Delete the uploaded file from R2 since we can't save it
      try {
        await r2.deleteObject(ctx, args.key);
      } catch {
        console.warn("Failed to delete rejected file:", args.key);
      }
      throw new Error(
        `Maximum of ${MAX_ATTACHMENTS} attachments allowed per arrangement`
      );
    }

    // Check file size
    if (args.size > MAX_ATTACHMENT_SIZE) {
      // Delete the uploaded file from R2 since we can't save it
      try {
        await r2.deleteObject(ctx, args.key);
      } catch {
        console.warn("Failed to delete rejected file:", args.key);
      }
      throw new Error(`File size exceeds maximum of 10 MB`);
    }

    // Add new attachment with next order number
    const newAttachment = {
      key: args.key,
      displayName: args.displayName,
      originalName: args.originalName,
      mimeType: args.mimeType,
      size: args.size,
      order: currentAttachments.length,
      uploadedAt: Date.now(),
    };

    await ctx.db.patch(args.arrangementId, {
      attachments: [...currentAttachments, newAttachment],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update an attachment's display name
 * Access: Arrangement owner or collaborators
 */
export const updateAttachment = mutation({
  args: {
    arrangementId: v.id("arrangements"),
    key: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check edit permission
    const hasPermission = await canEditArrangement(
      ctx,
      args.arrangementId,
      userId
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to edit this arrangement");
    }

    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    const attachments = arrangement.attachments ?? [];
    const attachmentIndex = attachments.findIndex((a) => a.key === args.key);

    if (attachmentIndex === -1) {
      throw new Error("Attachment not found");
    }

    // Update the display name
    const updatedAttachments = [...attachments];
    updatedAttachments[attachmentIndex] = {
      ...updatedAttachments[attachmentIndex],
      displayName: args.displayName,
    };

    await ctx.db.patch(args.arrangementId, {
      attachments: updatedAttachments,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove an attachment from an arrangement
 * Deletes from R2 and removes from database
 * Access: Arrangement owner or collaborators
 */
export const removeAttachment = mutation({
  args: {
    arrangementId: v.id("arrangements"),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check edit permission
    const hasPermission = await canEditArrangement(
      ctx,
      args.arrangementId,
      userId
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to edit this arrangement");
    }

    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    const attachments = arrangement.attachments ?? [];
    const attachmentIndex = attachments.findIndex((a) => a.key === args.key);

    if (attachmentIndex === -1) {
      throw new Error("Attachment not found");
    }

    // Delete from R2
    try {
      await r2.deleteObject(ctx, args.key);
    } catch {
      console.warn("Failed to delete attachment from R2:", args.key);
    }

    // Remove from array and reorder remaining attachments
    const updatedAttachments = attachments
      .filter((a) => a.key !== args.key)
      .map((a, index) => ({ ...a, order: index }));

    await ctx.db.patch(args.arrangementId, {
      attachments: updatedAttachments,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reorder attachments
 * Access: Arrangement owner or collaborators
 */
export const reorderAttachments = mutation({
  args: {
    arrangementId: v.id("arrangements"),
    orderedKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check edit permission
    const hasPermission = await canEditArrangement(
      ctx,
      args.arrangementId,
      userId
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to edit this arrangement");
    }

    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      throw new Error("Arrangement not found");
    }

    const attachments = arrangement.attachments ?? [];

    // Validate all keys exist
    const attachmentMap = new Map(attachments.map((a) => [a.key, a]));
    for (const key of args.orderedKeys) {
      if (!attachmentMap.has(key)) {
        throw new Error(`Attachment with key ${key} not found`);
      }
    }

    // Reorder attachments based on orderedKeys
    const reorderedAttachments = args.orderedKeys.map((key, index) => ({
      ...attachmentMap.get(key)!,
      order: index,
    }));

    await ctx.db.patch(args.arrangementId, {
      attachments: reorderedAttachments,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============ QUERIES ============

/**
 * Get signed URLs for all attachments of an arrangement
 * URLs are valid for 24 hours
 * Access: Everyone (arrangements are public)
 */
export const getAttachmentUrls = query({
  args: { arrangementId: v.id("arrangements") },
  handler: async (ctx, args) => {
    const arrangement = await ctx.db.get(args.arrangementId);
    if (!arrangement) {
      return [];
    }

    const attachments = arrangement.attachments ?? [];
    if (attachments.length === 0) {
      return [];
    }

    // Generate signed URLs for all attachments
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        try {
          const url = await r2.getUrl(attachment.key, {
            expiresIn: 60 * 60 * 24, // 24 hours
          });
          return {
            ...attachment,
            url,
          };
        } catch {
          console.warn("Failed to get URL for attachment:", attachment.key);
          return {
            ...attachment,
            url: null,
          };
        }
      })
    );

    // Sort by order
    return attachmentsWithUrls.sort((a, b) => a.order - b.order);
  },
});
