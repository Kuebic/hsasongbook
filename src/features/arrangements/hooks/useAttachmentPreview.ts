/**
 * useAttachmentPreview Hook
 *
 * Manages state for attachment preview dialog navigation.
 */

import { useState, useCallback, useMemo } from "react";
import type { Attachment } from "@/types/Arrangement.types";
import { isPreviewable } from "../validation/attachmentSchemas";

export interface UseAttachmentPreviewReturn {
  /** Index of currently selected attachment, or null if closed */
  selectedIndex: number | null;
  /** Open preview for attachment at given index */
  openPreview: (index: number) => void;
  /** Close the preview dialog */
  closePreview: () => void;
  /** Navigate to next previewable attachment */
  navigateNext: () => void;
  /** Navigate to previous previewable attachment */
  navigatePrev: () => void;
  /** Whether there's a next previewable attachment */
  canNavigateNext: boolean;
  /** Whether there's a previous previewable attachment */
  canNavigatePrev: boolean;
  /** Indices of all previewable attachments */
  previewableIndices: number[];
}

export function useAttachmentPreview(
  attachments: Attachment[]
): UseAttachmentPreviewReturn {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Get indices of previewable attachments
  const previewableIndices = useMemo(() => {
    return attachments
      .map((attachment, index) => ({ attachment, index }))
      .filter(({ attachment }) =>
        isPreviewable(attachment.mimeType, attachment.originalName)
      )
      .map(({ index }) => index);
  }, [attachments]);

  // Find position in previewable list
  const currentPreviewablePosition = useMemo(() => {
    if (selectedIndex === null) return -1;
    return previewableIndices.indexOf(selectedIndex);
  }, [selectedIndex, previewableIndices]);

  const canNavigateNext =
    currentPreviewablePosition !== -1 &&
    currentPreviewablePosition < previewableIndices.length - 1;

  const canNavigatePrev =
    currentPreviewablePosition !== -1 && currentPreviewablePosition > 0;

  const openPreview = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const closePreview = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const navigateNext = useCallback(() => {
    if (!canNavigateNext) return;
    const nextIndex = previewableIndices[currentPreviewablePosition + 1];
    setSelectedIndex(nextIndex);
  }, [canNavigateNext, previewableIndices, currentPreviewablePosition]);

  const navigatePrev = useCallback(() => {
    if (!canNavigatePrev) return;
    const prevIndex = previewableIndices[currentPreviewablePosition - 1];
    setSelectedIndex(prevIndex);
  }, [canNavigatePrev, previewableIndices, currentPreviewablePosition]);

  return {
    selectedIndex,
    openPreview,
    closePreview,
    navigateNext,
    navigatePrev,
    canNavigateNext,
    canNavigatePrev,
    previewableIndices,
  };
}
