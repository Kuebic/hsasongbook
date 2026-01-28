/**
 * useAttachmentDragReorder Hook
 *
 * Manages temporary local state during drag-and-drop to prevent animation
 * glitches from Convex's reactive queries. Holds reordered items locally
 * until the mutation completes and Convex syncs.
 *
 * Adapted from useDragReorder.ts in setlists feature.
 * @see https://github.com/clauderic/dnd-kit/discussions/1522
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Attachment } from "@/types/Arrangement.types";

interface UseAttachmentDragReorderReturn {
  /**
   * The items to render - uses temp state during drag, otherwise source items
   */
  items: Attachment[];
  /**
   * Call when drag ends to reorder items and persist
   */
  handleReorder: (
    sourceIndex: number,
    destinationIndex: number,
    persistFn: (orderedKeys: string[]) => Promise<{ success: boolean; error?: string }>
  ) => Promise<void>;
  /**
   * Whether a reorder operation is in progress
   */
  isReordering: boolean;
}

export function useAttachmentDragReorder(
  sourceItems: Attachment[]
): UseAttachmentDragReorderReturn {
  // Temporary state that holds reordered items during mutation
  const [tempItems, setTempItems] = useState<Attachment[] | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Track the latest source items to detect when Convex has synced
  const lastSourceRef = useRef<Attachment[]>(sourceItems);

  // Check if source items have been updated (Convex synced)
  // If so, clear temp state since we have fresh data
  // Using useEffect to avoid state updates during render
  useEffect(() => {
    if (
      tempItems !== null &&
      sourceItems !== lastSourceRef.current &&
      arraysMatch(sourceItems, tempItems)
    ) {
      // Source now matches our temp state - Convex has synced
      setTempItems(null);
      setIsReordering(false);
    }
    lastSourceRef.current = sourceItems;
  }, [sourceItems, tempItems]);

  const handleReorder = useCallback(
    async (
      sourceIndex: number,
      destinationIndex: number,
      persistFn: (orderedKeys: string[]) => Promise<{ success: boolean; error?: string }>
    ): Promise<void> => {
      if (sourceIndex === destinationIndex) return;

      // Use current items (either temp or source)
      const currentItems = tempItems ?? sourceItems;

      // Reorder the items
      const reordered = [...currentItems];
      const [removed] = reordered.splice(sourceIndex, 1);
      reordered.splice(destinationIndex, 0, removed);

      // Update order numbers
      const updatedItems = reordered.map((item, index) => ({
        ...item,
        order: index,
      }));

      // Set temp state IMMEDIATELY (synchronously) so dnd-kit animates correctly
      setTempItems(updatedItems);
      setIsReordering(true);

      // Persist to server (don't await - fire and forget)
      // The temp state will clear when Convex syncs back with matching data
      try {
        const orderedKeys = updatedItems.map((item) => item.key);
        await persistFn(orderedKeys);
      } catch (error) {
        // On error, revert to source items
        console.error("Failed to persist reorder:", error);
        setTempItems(null);
        setIsReordering(false);
      }
    },
    [sourceItems, tempItems]
  );

  return {
    items: tempItems ?? sourceItems,
    handleReorder,
    isReordering,
  };
}

/**
 * Check if two arrays of Attachment have the same items in the same order
 * (comparing by key and order)
 */
function arraysMatch(a: Attachment[], b: Attachment[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) => item.key === b[index].key && item.order === b[index].order
  );
}

export default useAttachmentDragReorder;
