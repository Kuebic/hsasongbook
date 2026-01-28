/**
 * AttachmentsSidebar Component
 *
 * Compact, collapsible attachments display for desktop sidebar.
 * Shows a limited number of files with expand/collapse functionality.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Music,
  Image,
  File,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Attachment } from "@/types/Arrangement.types";
import {
  getFileCategory,
  isPreviewable,
  type FileCategory,
} from "../../validation/attachmentSchemas";
import { useAttachmentPreview } from "../../hooks/useAttachmentPreview";
import AttachmentPreviewDialog from "./AttachmentPreviewDialog";

interface AttachmentsSidebarProps {
  attachments: Attachment[];
  /** Maximum files to show before collapsing (default: 2) */
  maxVisible?: number;
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

export default function AttachmentsSidebar({
  attachments,
  maxVisible = 2,
}: AttachmentsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const hasMore = attachments.length > maxVisible;
  const visibleAttachments = isExpanded
    ? attachments
    : attachments.slice(0, maxVisible);
  const hiddenCount = attachments.length - maxVisible;

  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          <span>Attachments ({attachments.length})</span>
        </div>

        {/* Compact file list */}
        <div className="space-y-1">
          {visibleAttachments.map((attachment, visibleIndex) => {
            const category = getFileCategory(
              attachment.mimeType,
              attachment.originalName
            );
            const canPreview = isPreviewable(
              attachment.mimeType,
              attachment.originalName
            );
            // Find the actual index in the full attachments array
            const actualIndex = isExpanded
              ? visibleIndex
              : attachments.findIndex((a) => a.key === attachment.key);

            const handleClick = () => {
              if (canPreview) {
                openPreview(actualIndex);
              } else {
                // Open non-previewable files in new tab
                window.open(attachment.url, "_blank", "noopener,noreferrer");
              }
            };

            return (
              <div
                key={attachment.key}
                onClick={handleClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleClick();
                }}
                role="button"
                tabIndex={0}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer"
                aria-label={
                  canPreview
                    ? `Preview ${attachment.displayName}`
                    : `Open ${attachment.displayName}`
                }
              >
                {/* File icon */}
                <FileIcon category={category} className="h-4 w-4 flex-shrink-0" />

                {/* Filename */}
                <span className="text-sm truncate flex-1">
                  {attachment.displayName}
                </span>

                {/* Download icon on hover */}
                <Download className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Expand/collapse button */}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Show {hiddenCount} more
              </>
            )}
          </Button>
        )}
      </div>

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
