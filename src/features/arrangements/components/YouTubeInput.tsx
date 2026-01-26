/**
 * YouTubeInput Component
 *
 * Input field for YouTube video URLs with validation and thumbnail preview.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, X, Youtube, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  extractYoutubeVideoId,
  isValidYoutubeUrl,
  getYoutubeThumbnailUrl,
} from '../validation/audioSchemas';

interface YouTubeInputProps {
  /** Current YouTube URL value */
  value?: string;
  /** Callback when URL changes (called on blur or save) */
  onChange: (url: string | undefined) => Promise<void>;
  /** Whether the input is disabled */
  disabled?: boolean;
}

export default function YouTubeInput({
  value,
  onChange,
  disabled = false,
}: YouTubeInputProps) {
  const [inputValue, setInputValue] = useState(value ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Extract video ID for thumbnail
  const videoId = inputValue ? extractYoutubeVideoId(inputValue) : null;
  const thumbnailUrl = videoId ? getYoutubeThumbnailUrl(videoId) : null;

  // Sync with external value changes
  useEffect(() => {
    if (value !== undefined && value !== inputValue && !isDirty) {
      setInputValue(value);
    }
  }, [value, inputValue, isDirty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsDirty(true);
    setError(null);
  };

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    const trimmed = inputValue.trim();

    // Validate if not empty
    if (trimmed && !isValidYoutubeUrl(trimmed)) {
      setError('Please enter a valid YouTube URL or video ID');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await onChange(trimmed || undefined);
      setIsDirty(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [inputValue, isDirty, onChange]);

  const handleBlur = () => {
    if (isDirty) {
      handleSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleClear = async () => {
    setInputValue('');
    setIsDirty(true);
    setError(null);

    try {
      setIsSaving(true);
      await onChange(undefined);
      setIsDirty(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenYoutube = () => {
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }
  };

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

      {/* Input with icon */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Youtube className="h-4 w-4" />
        </div>
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Paste YouTube URL or video ID"
          disabled={disabled || isSaving}
          className={cn(
            'pl-10 pr-10',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {(inputValue || isSaving) && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        e.g., https://youtube.com/watch?v=... or youtu.be/...
      </p>

      {/* Thumbnail preview */}
      {videoId && thumbnailUrl && (
        <div className="relative rounded-lg overflow-hidden bg-muted">
          <img
            src={thumbnailUrl}
            alt="YouTube video thumbnail"
            className="w-full h-auto aspect-video object-cover"
            onError={(e) => {
              // Hide image on error (video might not exist)
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenYoutube}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open on YouTube
            </Button>
          </div>
          {/* YouTube play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-9 bg-[#FF0000] rounded-lg flex items-center justify-center">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
