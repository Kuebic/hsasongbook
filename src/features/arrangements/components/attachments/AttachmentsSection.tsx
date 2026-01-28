/**
 * AttachmentsSection Component
 *
 * Main container for the attachments feature in edit mode.
 * Combines upload zone and sortable list.
 */

import AttachmentUpload from "./AttachmentUpload";
import AttachmentList from "./AttachmentList";
import { useArrangementAttachments } from "../../hooks/useArrangementAttachments";
import { Skeleton } from "@/components/ui/skeleton";

interface AttachmentsSectionProps {
  arrangementId: string;
  disabled?: boolean;
}

export default function AttachmentsSection({
  arrangementId,
  disabled = false,
}: AttachmentsSectionProps) {
  const {
    attachments,
    loading,
    canAddMore,
    attachmentCount,
    uploadAttachment,
    renameAttachment,
    removeAttachment,
    reorderAttachments,
  } = useArrangementAttachments(arrangementId);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <AttachmentUpload
        onUpload={uploadAttachment}
        disabled={disabled}
        canAddMore={canAddMore}
        currentCount={attachmentCount}
      />

      {/* Attachment list */}
      {attachments.length > 0 && (
        <AttachmentList
          attachments={attachments}
          onRemove={removeAttachment}
          onRename={renameAttachment}
          onReorder={reorderAttachments}
          disabled={disabled}
        />
      )}

      {/* Empty state hint */}
      {attachments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Add PDFs, sheet music, or other reference files
        </p>
      )}
    </div>
  );
}
