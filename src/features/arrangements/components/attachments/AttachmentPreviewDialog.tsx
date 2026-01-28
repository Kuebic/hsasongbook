/**
 * AttachmentPreviewDialog Component
 *
 * Full-screen dialog for previewing images and PDFs.
 * Features:
 * - Image preview with native <img> tag
 * - PDF preview with native browser viewer via <iframe>
 * - Navigation between previewable attachments
 * - Swipe gestures for mobile navigation
 * - Keyboard navigation (Escape to close, arrow keys to navigate)
 * - Loading and error states with download fallback
 */

import { useState, useEffect, useCallback, useRef, type TouchEvent } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Attachment } from "@/types/Arrangement.types";
import { getFileCategory, type FileCategory } from "../../validation/attachmentSchemas";

interface AttachmentPreviewDialogProps {
  attachments: Attachment[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
  canNavigateNext: boolean;
  canNavigatePrev: boolean;
}

export default function AttachmentPreviewDialog({
  attachments,
  selectedIndex,
  onClose,
  onNavigateNext,
  onNavigatePrev,
  canNavigateNext,
  canNavigatePrev,
}: AttachmentPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const isOpen = selectedIndex !== null;
  const attachment = selectedIndex !== null ? attachments[selectedIndex] : null;
  const category = attachment
    ? getFileCategory(attachment.mimeType, attachment.originalName)
    : null;

  // Reset loading/error state when attachment changes
  const attachmentKey = attachment?.key;
  useEffect(() => {
    if (attachmentKey) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [attachmentKey]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (canNavigatePrev) onNavigatePrev();
          break;
        case "ArrowRight":
          if (canNavigateNext) onNavigateNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, canNavigateNext, canNavigatePrev, onNavigateNext, onNavigatePrev, onClose]);

  // Swipe gesture handling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchStartX.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      const SWIPE_THRESHOLD = 50;

      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0 && canNavigateNext) {
          // Swiped left -> next
          onNavigateNext();
        } else if (diff < 0 && canNavigatePrev) {
          // Swiped right -> prev
          onNavigatePrev();
        }
      }

      touchStartX.current = null;
    },
    [canNavigateNext, canNavigatePrev, onNavigateNext, onNavigatePrev]
  );

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const renderPreview = (attachment: Attachment, category: FileCategory) => {
    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <p className="text-lg font-medium">Failed to load preview</p>
            <p className="text-sm text-muted-foreground mt-1">
              The file may have expired or failed to load.
            </p>
          </div>
          {attachment.url && (
            <Button asChild>
              <a
                href={attachment.url}
                download={attachment.originalName}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4 mr-2" />
                Download instead
              </a>
            </Button>
          )}
        </div>
      );
    }

    switch (category) {
      case "image":
        return (
          <img
            src={attachment.url}
            alt={attachment.displayName}
            className="max-w-full max-h-full object-contain"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        );
      case "pdf":
        return (
          <iframe
            src={attachment.url}
            title={attachment.displayName}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleImageError}
          />
        );
      default:
        // Non-previewable file (shouldn't happen, but handle gracefully)
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
            <p className="text-lg font-medium">Preview not available</p>
            <p className="text-sm text-muted-foreground">
              This file type cannot be previewed in the browser.
            </p>
            {attachment.url && (
              <Button asChild>
                <a
                  href={attachment.url}
                  download={attachment.originalName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download file
                </a>
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-none w-screen h-screen sm:max-w-[90vw] sm:max-h-[90vh] sm:h-auto p-0 gap-0 bg-background/95 backdrop-blur-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <VisuallyHidden>
          <DialogTitle>
            {attachment?.displayName ?? "Attachment preview"}
          </DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-background">
          <div className="flex-1 min-w-0 mr-2">
            <p className="font-medium truncate text-sm">
              {attachment?.displayName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {attachment?.url && (
              <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview content */}
        <div
          ref={contentRef}
          className="flex-1 flex items-center justify-center overflow-hidden relative min-h-0 h-[calc(100vh-60px)] sm:h-[calc(90vh-120px)]"
        >
          {/* Loading spinner */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Navigation buttons */}
          {canNavigatePrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background shadow-md z-10"
              onClick={onNavigatePrev}
              aria-label="Previous attachment"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {canNavigateNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background shadow-md z-10"
              onClick={onNavigateNext}
              aria-label="Next attachment"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Preview content */}
          {attachment && category && renderPreview(attachment, category)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
