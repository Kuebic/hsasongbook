/**
 * ProfilePictureUpload Component
 *
 * Allows authenticated users to upload a profile picture.
 * Features:
 * - Drag and drop support
 * - Click to select file
 * - Client-side validation (size, type)
 * - Preview before upload
 * - Upload progress indication
 * - Auto-deletes old avatar on new upload
 */

import { useState, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { useUploadFile } from '@convex-dev/r2/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { AlertCircle, Upload, X, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProfilePictureUpload({
  currentAvatarUrl,
  onSuccess,
  onCancel,
}: ProfilePictureUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // R2 upload hook - pass the files API which exports generateUploadUrl and syncMetadata
  const uploadFile = useUploadFile(api.files);
  const saveAvatar = useMutation(api.files.saveAvatar);
  const removeAvatar = useMutation(api.files.removeAvatar);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 2MB';
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

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

      // Upload to R2 and get the key
      const key = await uploadFile(selectedFile);

      // Save the key to the user record (this also deletes the old avatar)
      await saveAvatar({ key });

      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      setError(null);
      await removeAvatar();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove avatar';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div
          className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Drop zone / Preview area */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {displayUrl ? (
          // Show preview/current avatar
          <div className="relative">
            <img
              src={displayUrl}
              alt="Profile preview"
              className="w-32 h-32 rounded-full object-cover"
            />
            {selectedFile && !isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSelection();
                }}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          // Show placeholder
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="p-4 bg-muted rounded-full">
              <User className="h-12 w-12" />
            </div>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="text-sm">
                {isDragOver ? 'Drop image here' : 'Click or drag to upload'}
              </span>
            </div>
            <span className="text-xs">JPEG, PNG, GIF, WebP (max 2MB)</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* Actions */}
      <div className="flex gap-2">
        {selectedFile ? (
          <>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Save Avatar'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClearSelection}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
            {currentAvatarUrl && (
              <Button
                variant="destructive"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
              >
                Remove
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={onCancel} disabled={isUploading}>
                Cancel
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
