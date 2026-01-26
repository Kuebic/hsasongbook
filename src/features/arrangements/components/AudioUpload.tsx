/**
 * AudioUpload Component
 *
 * Allows users to upload MP3 files to arrangements.
 * Features:
 * - Drag and drop support
 * - Click to select file
 * - Client-side validation (size, type)
 * - Upload progress indication
 * - Replace/remove functionality
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Upload, X, Music, Loader2, FileAudio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateAudioFile, formatFileSize, MAX_AUDIO_FILE_SIZE } from '../validation/audioSchemas';

interface AudioUploadProps {
  /** Current audio URL (if audio exists) */
  currentAudioUrl?: string | null;
  /** Whether audio file exists */
  hasAudio?: boolean;
  /** Callback when upload succeeds */
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
  /** Callback when remove succeeds */
  onRemove: () => Promise<{ success: boolean; error?: string }>;
  /** Whether the component is disabled */
  disabled?: boolean;
}

export default function AudioUpload({
  currentAudioUrl,
  hasAudio = false,
  onUpload,
  onRemove,
  disabled = false,
}: AudioUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);

    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file');
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
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

    if (disabled) return;

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
        setError(result.error ?? 'Upload failed');
        return;
      }

      // Clear selection on success
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      setError(null);

      const result = await onRemove();

      if (!result.success) {
        setError(result.error ?? 'Failed to remove audio');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove audio';
      setError(message);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isProcessing = isUploading || isRemoving;

  return (
    <div className="space-y-3">
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

      {/* Drop zone / Current audio indicator */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed rounded-lg transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isProcessing && 'pointer-events-none opacity-60',
          disabled && 'pointer-events-none opacity-50',
          !disabled && !isProcessing && 'cursor-pointer'
        )}
        onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          // Show selected file info
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <FileAudio className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!isProcessing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSelection();
                }}
                className="absolute top-2 right-2 p-1 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : hasAudio || currentAudioUrl ? (
          // Show existing audio indicator
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Audio file attached
            </p>
            <p className="text-xs text-muted-foreground">
              Click or drag to replace
            </p>
          </div>
        ) : (
          // Show placeholder
          <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground text-center">
            <div className="p-3 bg-muted rounded-full">
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                {isDragOver ? 'Drop MP3 here' : 'Click or drag to upload'}
              </p>
              <p className="text-xs">
                MP3 only, max {formatFileSize(MAX_AUDIO_FILE_SIZE)}
              </p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {isUploading ? 'Uploading...' : 'Removing...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,.mp3"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Actions */}
      <div className="flex gap-2">
        {selectedFile ? (
          <>
            <Button
              onClick={handleUpload}
              disabled={isProcessing || disabled}
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
                  Upload Audio
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              disabled={isProcessing || disabled}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || disabled}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {hasAudio ? 'Replace Audio' : 'Choose File'}
            </Button>
            {hasAudio && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isProcessing || disabled}
                className="text-destructive hover:text-destructive"
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
