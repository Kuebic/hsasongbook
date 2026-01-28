/**
 * useArrangementAttachments Hook
 *
 * Provides access to arrangement file attachments and management capabilities.
 * Handles uploads to R2, renaming, deletion, and reordering.
 */

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUploadFile } from "@convex-dev/r2/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { Attachment } from "@/types/Arrangement.types";
import {
  validateAttachmentFile,
  generateDisplayName,
  MAX_ATTACHMENTS_PER_ARRANGEMENT,
} from "../validation/attachmentSchemas";

interface UseArrangementAttachmentsReturn {
  /** List of attachments with signed URLs */
  attachments: Attachment[];
  /** Loading state */
  loading: boolean;
  /** Whether more attachments can be added (not at limit) */
  canAddMore: boolean;
  /** Current attachment count */
  attachmentCount: number;
  /** Upload a file attachment */
  uploadAttachment: (
    file: File,
    displayName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  /** Update an attachment's display name */
  renameAttachment: (
    key: string,
    displayName: string
  ) => Promise<{ success: boolean; error?: string }>;
  /** Remove an attachment */
  removeAttachment: (
    key: string
  ) => Promise<{ success: boolean; error?: string }>;
  /** Reorder attachments */
  reorderAttachments: (
    orderedKeys: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  /** Validate file before upload */
  validateFile: (file: File) => { valid: boolean; error?: string };
}

/**
 * Hook for managing arrangement file attachments
 *
 * @param arrangementId - The arrangement ID to manage attachments for
 * @returns Attachments, loading state, and CRUD functions
 */
export function useArrangementAttachments(
  arrangementId: string | null
): UseArrangementAttachmentsReturn {
  // Query for attachments with signed URLs
  const attachmentsData = useQuery(
    api.attachments.getAttachmentUrls,
    arrangementId
      ? { arrangementId: arrangementId as Id<"arrangements"> }
      : "skip"
  );

  // Mutations
  const addAttachmentMutation = useMutation(api.attachments.addAttachment);
  const updateAttachmentMutation = useMutation(api.attachments.updateAttachment);
  const removeAttachmentMutation = useMutation(api.attachments.removeAttachment);
  const reorderAttachmentsMutation = useMutation(api.attachments.reorderAttachments);

  // R2 upload hook
  const uploadFile = useUploadFile(api.files);

  /**
   * Validate file before upload
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      return validateAttachmentFile(file);
    },
    []
  );

  /**
   * Upload a file attachment
   */
  const uploadAttachment = useCallback(
    async (
      file: File,
      displayName?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!arrangementId) {
        return { success: false, error: "No arrangement selected" };
      }

      // Check if at limit
      const currentCount = attachmentsData?.length ?? 0;
      if (currentCount >= MAX_ATTACHMENTS_PER_ARRANGEMENT) {
        return {
          success: false,
          error: `Maximum of ${MAX_ATTACHMENTS_PER_ARRANGEMENT} attachments allowed`,
        };
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      try {
        // Upload to R2
        const key = await uploadFile(file);

        // Generate display name if not provided
        const finalDisplayName = displayName || generateDisplayName(file.name);

        // Add attachment to arrangement
        await addAttachmentMutation({
          arrangementId: arrangementId as Id<"arrangements">,
          key,
          displayName: finalDisplayName,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        });

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to upload attachment";
        return { success: false, error: message };
      }
    },
    [arrangementId, attachmentsData?.length, uploadFile, addAttachmentMutation, validateFile]
  );

  /**
   * Rename an attachment
   */
  const renameAttachment = useCallback(
    async (
      key: string,
      displayName: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!arrangementId) {
        return { success: false, error: "No arrangement selected" };
      }

      if (!displayName.trim()) {
        return { success: false, error: "Display name cannot be empty" };
      }

      try {
        await updateAttachmentMutation({
          arrangementId: arrangementId as Id<"arrangements">,
          key,
          displayName: displayName.trim(),
        });
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to rename attachment";
        return { success: false, error: message };
      }
    },
    [arrangementId, updateAttachmentMutation]
  );

  /**
   * Remove an attachment
   */
  const removeAttachment = useCallback(
    async (key: string): Promise<{ success: boolean; error?: string }> => {
      if (!arrangementId) {
        return { success: false, error: "No arrangement selected" };
      }

      try {
        await removeAttachmentMutation({
          arrangementId: arrangementId as Id<"arrangements">,
          key,
        });
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to remove attachment";
        return { success: false, error: message };
      }
    },
    [arrangementId, removeAttachmentMutation]
  );

  /**
   * Reorder attachments
   */
  const reorderAttachments = useCallback(
    async (
      orderedKeys: string[]
    ): Promise<{ success: boolean; error?: string }> => {
      if (!arrangementId) {
        return { success: false, error: "No arrangement selected" };
      }

      try {
        await reorderAttachmentsMutation({
          arrangementId: arrangementId as Id<"arrangements">,
          orderedKeys,
        });
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reorder attachments";
        return { success: false, error: message };
      }
    },
    [arrangementId, reorderAttachmentsMutation]
  );

  const attachments = (attachmentsData ?? []) as Attachment[];
  const attachmentCount = attachments.length;

  return {
    attachments,
    loading: attachmentsData === undefined,
    canAddMore: attachmentCount < MAX_ATTACHMENTS_PER_ARRANGEMENT,
    attachmentCount,
    uploadAttachment,
    renameAttachment,
    removeAttachment,
    reorderAttachments,
    validateFile,
  };
}

export default useArrangementAttachments;
