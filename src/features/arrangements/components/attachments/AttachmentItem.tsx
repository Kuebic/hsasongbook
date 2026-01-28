/**
 * AttachmentItem Component
 *
 * Sortable attachment row using @dnd-kit/sortable.
 * Features: drag handle, file icon, name, size, download, rename, delete.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  GripVertical,
  X,
  Pencil,
  Download,
  FileText,
  Music,
  Image,
  File,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/types/Arrangement.types";
import {
  getFileCategory,
  formatFileSize,
  type FileCategory,
} from "../../validation/attachmentSchemas";

interface AttachmentItemProps {
  attachment: Attachment;
  onRemove: () => void;
  onRename: () => void;
  disabled?: boolean;
  isRemoving?: boolean;
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
  switch (category) {
    case "pdf":
      return <FileText className={cn("text-red-500", className)} />;
    case "notation":
      return <Music className={cn("text-purple-500", className)} />;
    case "image":
      return <Image className={cn("text-blue-500", className)} />;
    case "document":
      return <FileText className={cn("text-gray-500", className)} />;
    default:
      return <File className={cn("text-muted-foreground", className)} />;
  }
}

export default function AttachmentItem({
  attachment,
  onRemove,
  onRename,
  disabled = false,
  isRemoving = false,
}: AttachmentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attachment.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const category = getFileCategory(attachment.mimeType, attachment.originalName);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-transparent",
        isDragging && "border-primary/50",
        disabled && "opacity-50"
      )}
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "touch-none cursor-grab active:cursor-grabbing p-1 -m-1 rounded",
          "hover:bg-muted transition-colors",
          "min-w-[44px] min-h-[44px] flex items-center justify-center",
          disabled && "pointer-events-none"
        )}
        aria-label="Drag to reorder"
        type="button"
        disabled={disabled}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* File icon */}
      <div className="flex-shrink-0">
        <FileIcon category={category} className="h-5 w-5" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{attachment.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Download button */}
        {attachment.url && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            asChild
            disabled={disabled}
          >
            <a
              href={attachment.url}
              download={attachment.originalName}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download file"
            >
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}

        {/* Rename button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onRename}
          disabled={disabled || isRemoving}
          aria-label="Rename file"
          type="button"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-destructive hover:text-destructive"
          onClick={onRemove}
          disabled={disabled || isRemoving}
          aria-label="Remove file"
          type="button"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
