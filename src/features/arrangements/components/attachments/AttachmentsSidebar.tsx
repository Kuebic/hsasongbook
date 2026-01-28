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
  type FileCategory,
} from "../../validation/attachmentSchemas";

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

  if (attachments.length === 0) {
    return null;
  }

  const hasMore = attachments.length > maxVisible;
  const visibleAttachments = isExpanded
    ? attachments
    : attachments.slice(0, maxVisible);
  const hiddenCount = attachments.length - maxVisible;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Paperclip className="h-3.5 w-3.5" />
        <span>Attachments ({attachments.length})</span>
      </div>

      {/* Compact file list */}
      <div className="space-y-1">
        {visibleAttachments.map((attachment) => {
          const category = getFileCategory(
            attachment.mimeType,
            attachment.originalName
          );

          return (
            <a
              key={attachment.key}
              href={attachment.url}
              download={attachment.originalName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
              aria-label={`Download ${attachment.displayName}`}
            >
              {/* File icon */}
              <FileIcon category={category} className="h-4 w-4 flex-shrink-0" />

              {/* Filename */}
              <span className="text-sm truncate flex-1">
                {attachment.displayName}
              </span>

              {/* Download icon on hover */}
              <Download className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
            </a>
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
  );
}
