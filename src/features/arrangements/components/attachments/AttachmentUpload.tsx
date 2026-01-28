/**
 * AttachmentUpload Component
 *
 * Allows users to upload file attachments.
 * Features:
 * - Drag and drop support
 * - Click to select file
 * - Client-side validation (size, type)
 * - Upload progress indication
 * - File count indicator
 */

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload, Loader2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validateAttachmentFile,
  formatFileSize,
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENTS_PER_ARRANGEMENT,
  ATTACHMENT_ACCEPT_STRING,
} from "../../validation/attachmentSchemas";

interface AttachmentUploadProps {
  /** Callback when upload succeeds */
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether more attachments can be added */
  canAddMore: boolean;
  /** Current attachment count */
  currentCount: number;
}

export default function AttachmentUpload({
  onUpload,
  disabled = false,
  canAddMore,
  currentCount,
}: AttachmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!canAddMore) {
        setError(
          `Maximum of ${MAX_ATTACHMENTS_PER_ARRANGEMENT} attachments reached`
        );
        return;
      }

      const validation = validateAttachmentFile(file);
      if (!validation.valid) {
        setError(validation.error ?? "Invalid file");
        return;
      }

      setSelectedFile(file);
    },
    [canAddMore]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && canAddMore) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || !canAddMore) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);

      const result = await onUpload(selectedFile);

      if (!result.success) {
        setError(result.error ?? "Upload failed");
        return;
      }

      // Clear selection on success
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload file";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isDisabled = disabled || !canAddMore;

  return (
    <div className="space-y-3">
      {/* File count indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {currentCount} of {MAX_ATTACHMENTS_PER_ARRANGEMENT} files
        </span>
        {!canAddMore && (
          <span className="text-amber-600 dark:text-amber-500">Limit reached</span>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div
          className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed rounded-lg transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "pointer-events-none opacity-60",
          isDisabled && "pointer-events-none opacity-50",
          !isDisabled && !isUploading && "cursor-pointer"
        )}
        onClick={() => !isDisabled && !isUploading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          // Show selected file info
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="p-2 bg-primary/10 rounded-full">
              <Paperclip className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium truncate max-w-[250px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        ) : (
          // Show placeholder
          <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground text-center">
            <div className="p-2 bg-muted rounded-full">
              <Upload className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                {isDragOver ? "Drop file here" : "Click or drag to upload"}
              </p>
              <p className="text-xs">
                Max {formatFileSize(MAX_ATTACHMENT_SIZE)} per file
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT_STRING}
        onChange={handleInputChange}
        className="hidden"
        disabled={isDisabled || isUploading}
      />

      {/* Actions */}
      {selectedFile && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || isDisabled}
            size="sm"
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
