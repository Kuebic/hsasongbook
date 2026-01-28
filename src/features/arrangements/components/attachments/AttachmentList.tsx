/**
 * AttachmentList Component
 *
 * Sortable list container using @dnd-kit.
 * Wraps AttachmentItem components with DndContext and SortableContext.
 */

import { useState } from "react";
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import AttachmentItem from "./AttachmentItem";
import AttachmentRenameDialog from "./AttachmentRenameDialog";
import AttachmentPreviewDialog from "./AttachmentPreviewDialog";
import type { Attachment } from "@/types/Arrangement.types";
import { useAttachmentDragReorder } from "../../hooks/useAttachmentDragReorder";
import { useAttachmentPreview } from "../../hooks/useAttachmentPreview";
import { isPreviewable } from "../../validation/attachmentSchemas";

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove: (key: string) => Promise<{ success: boolean; error?: string }>;
  onRename: (
    key: string,
    displayName: string
  ) => Promise<{ success: boolean; error?: string }>;
  onReorder: (
    orderedKeys: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

export default function AttachmentList({
  attachments,
  onRemove,
  onRename,
  onReorder,
  disabled = false,
}: AttachmentListProps) {
  // Use local state during drag to prevent animation glitches from Convex reactivity
  const { items: dragItems, handleReorder } = useAttachmentDragReorder(attachments);

  // Track which attachment is being removed
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  // Track which attachment is being renamed
  const [renamingAttachment, setRenamingAttachment] = useState<Attachment | null>(
    null
  );

  // Preview state
  const {
    selectedIndex,
    openPreview,
    closePreview,
    navigateNext,
    navigatePrev,
    canNavigateNext,
    canNavigatePrev,
  } = useAttachmentPreview(attachments);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = dragItems.findIndex((a) => a.key === active.id);
      const newIndex = dragItems.findIndex((a) => a.key === over.id);
      // Use handleReorder which manages local state to prevent animation glitches
      handleReorder(oldIndex, newIndex, onReorder);
    }
  };

  const handleRemove = async (key: string) => {
    setRemovingKey(key);
    try {
      await onRemove(key);
    } finally {
      setRemovingKey(null);
    }
  };

  const handleRenameSubmit = async (newName: string) => {
    if (!renamingAttachment) return;
    await onRename(renamingAttachment.key, newName);
    setRenamingAttachment(null);
  };

  if (dragItems.length === 0) {
    return null;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={dragItems.map((a) => a.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {dragItems.map((attachment, index) => {
              const canPreview = isPreviewable(
                attachment.mimeType,
                attachment.originalName
              );
              return (
                <AttachmentItem
                  key={attachment.key}
                  attachment={attachment}
                  onRemove={() => handleRemove(attachment.key)}
                  onRename={() => setRenamingAttachment(attachment)}
                  onPreview={canPreview ? () => openPreview(index) : undefined}
                  disabled={disabled}
                  isRemoving={removingKey === attachment.key}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Rename dialog */}
      <AttachmentRenameDialog
        open={renamingAttachment !== null}
        onOpenChange={(open) => !open && setRenamingAttachment(null)}
        currentName={renamingAttachment?.displayName ?? ""}
        onSave={handleRenameSubmit}
      />

      {/* Preview dialog */}
      <AttachmentPreviewDialog
        attachments={attachments}
        selectedIndex={selectedIndex}
        onClose={closePreview}
        onNavigateNext={navigateNext}
        onNavigatePrev={navigatePrev}
        canNavigateNext={canNavigateNext}
        canNavigatePrev={canNavigatePrev}
      />
    </>
  );
}
