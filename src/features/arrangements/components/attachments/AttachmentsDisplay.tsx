/**
 * AttachmentsDisplay Component
 *
 * Read-only display of attachments for non-edit mode.
 * Shows file icon, name, size, and download link.
 * Click on previewable files (images, PDFs) opens a preview dialog.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  FileText,
  Music,
  Image,
  File,
  Paperclip,
} from "lucide-react";
import type { Attachment } from "@/types/Arrangement.types";
import {
  getFileCategory,
  formatFileSize,
  isPreviewable,
  type FileCategory,
} from "../../validation/attachmentSchemas";
import { useAttachmentPreview } from "../../hooks/useAttachmentPreview";
import AttachmentPreviewDialog from "./AttachmentPreviewDialog";

interface AttachmentsDisplayProps {
  attachments: Attachment[];
}

/**
 * Get the appropriate icon component for a file category
 */
function FileIcon({
  category,
  className,
}: {
  category: FileCategory;
  className?: string;
}) {
  const iconClass = className ?? "h-4 w-4";
  switch (category) {
    case "pdf":
      return <FileText className={`${iconClass} text-red-500`} />;
    case "notation":
      return <Music className={`${iconClass} text-purple-500`} />;
    case "image":
      return <Image className={`${iconClass} text-blue-500`} />;
    case "document":
      return <FileText className={`${iconClass} text-gray-500`} />;
    default:
      return <File className={`${iconClass} text-muted-foreground`} />;
  }
}

export default function AttachmentsDisplay({
  attachments,
}: AttachmentsDisplayProps) {
  const {
    selectedIndex,
    openPreview,
    closePreview,
    navigateNext,
    navigatePrev,
    canNavigateNext,
    canNavigatePrev,
  } = useAttachmentPreview(attachments);

  if (attachments.length === 0) {
    return null;
  }

  const handleAttachmentClick = (index: number, attachment: Attachment) => {
    if (isPreviewable(attachment.mimeType, attachment.originalName)) {
      openPreview(index);
    }
    // Non-previewable files: do nothing (user can use download button)
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Attachments
            <span className="text-muted-foreground font-normal">
              ({attachments.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attachments.map((attachment, index) => {
              const category = getFileCategory(
                attachment.mimeType,
                attachment.originalName
              );
              const canPreview = isPreviewable(
                attachment.mimeType,
                attachment.originalName
              );

              return (
                <div
                  key={attachment.key}
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                    canPreview
                      ? "hover:bg-muted/50 cursor-pointer"
                      : "hover:bg-muted/30"
                  }`}
                  onClick={() => handleAttachmentClick(index, attachment)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canPreview) {
                      handleAttachmentClick(index, attachment);
                    }
                  }}
                  role={canPreview ? "button" : undefined}
                  tabIndex={canPreview ? 0 : undefined}
                  aria-label={
                    canPreview
                      ? `Preview ${attachment.displayName}`
                      : undefined
                  }
                >
                  {/* File icon */}
                  <FileIcon category={category} className="h-5 w-5 flex-shrink-0" />

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>

                  {/* Download button */}
                  {attachment.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={attachment.url}
                        download={attachment.originalName}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download ${attachment.displayName}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="sr-only sm:not-sr-only">Download</span>
                      </a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
