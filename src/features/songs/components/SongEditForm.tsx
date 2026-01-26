/**
 * SongEditForm Component
 * Form for editing an existing song's metadata.
 * Uses React Hook Form with Zod validation.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { SONG_ORIGIN_GROUPS } from '../validation/songSchemas';
import type { Id } from '../../../../convex/_generated/dataModel';
import { parseCommaSeparatedTags } from '@/features/shared/utils/dataHelpers';
import { extractErrorMessage } from '@/lib/utils';
import { suggestThemes } from '@/lib/themeSuggester';
import { ThemeSuggestions } from './ThemeSuggestions';

// Edit form schema (all fields optional since partial updates allowed)
const editSongSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  artist: z.string().max(200).optional(),
  themes: z.string().optional(),
  copyright: z.string().max(500).optional(),
  lyrics: z.string().optional(),
  origin: z.string().optional(),
});

type EditSongFormData = z.infer<typeof editSongSchema>;

interface SongEditFormProps {
  songId: string;
  initialData: {
    title: string;
    artist?: string;
    themes?: string[];
    copyright?: string;
    lyrics?: string;
    origin?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SongEditForm({
  songId,
  initialData,
  onSuccess,
  onCancel,
}: SongEditFormProps) {
  const updateSong = useMutation(api.songs.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Origin state (managed separately for Select component)
  const [origin, setOrigin] = useState<string>(initialData.origin || '');
  // Theme suggestion state (updates on lyrics blur)
  const [lyricsForSuggestion, setLyricsForSuggestion] = useState<string>(
    initialData.lyrics || ''
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditSongFormData>({
    resolver: zodResolver(editSongSchema),
    mode: 'onBlur',
    defaultValues: {
      title: initialData.title,
      artist: initialData.artist || '',
      themes: initialData.themes?.join(', ') || '',
      copyright: initialData.copyright || '',
      lyrics: initialData.lyrics || '',
      origin: initialData.origin || '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    reset({
      title: initialData.title,
      artist: initialData.artist || '',
      themes: initialData.themes?.join(', ') || '',
      copyright: initialData.copyright || '',
      lyrics: initialData.lyrics || '',
      origin: initialData.origin || '',
    });
    setOrigin(initialData.origin || '');
    setLyricsForSuggestion(initialData.lyrics || '');
  }, [initialData, reset]);

  // Theme suggestions
  const themesValue = watch('themes') || '';
  const suggestedThemes = useMemo(
    () => suggestThemes(lyricsForSuggestion),
    [lyricsForSuggestion]
  );
  const selectedThemes = useMemo(
    () => parseCommaSeparatedTags(themesValue),
    [themesValue]
  );

  const handleThemeSuggestionSelect = (theme: string) => {
    const newThemes = themesValue ? `${themesValue}, ${theme}` : theme;
    setValue('themes', newThemes, { shouldDirty: true });
  };

  const onSubmit = async (data: EditSongFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Parse themes from comma-separated string
      const themes = data.themes
        ? parseCommaSeparatedTags(data.themes)
        : undefined;

      // Update song via Convex mutation
      await updateSong({
        id: songId as Id<'songs'>,
        title: data.title,
        artist: data.artist || undefined,
        themes,
        copyright: data.copyright || undefined,
        lyrics: data.lyrics || undefined,
        origin: origin || undefined,
      });

      onSuccess?.();
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Global error message */}
      {submitError && (
        <div
          className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{submitError}</p>
        </div>
      )}

      {/* Title field (required) */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Amazing Grace"
          disabled={isSubmitting}
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={errors.title ? 'title-error' : undefined}
          {...register('title')}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Artist field (optional) */}
      <div>
        <Label htmlFor="artist">Artist</Label>
        <Input
          id="artist"
          type="text"
          placeholder="e.g., John Newton"
          disabled={isSubmitting}
          aria-invalid={errors.artist ? 'true' : 'false'}
          aria-describedby={errors.artist ? 'artist-error' : undefined}
          {...register('artist')}
        />
        {errors.artist && (
          <p id="artist-error" className="text-sm text-destructive mt-1">
            {errors.artist.message}
          </p>
        )}
      </div>

      {/* Origin field (optional dropdown) */}
      <div>
        <Label htmlFor="origin">Origin</Label>
        <Select value={origin} onValueChange={setOrigin} disabled={isSubmitting}>
          <SelectTrigger id="origin">
            <SelectValue placeholder="Select origin..." />
          </SelectTrigger>
          <SelectContent>
            {SONG_ORIGIN_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.origins.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Themes field (comma-separated) */}
      <div>
        <Label htmlFor="themes">Themes</Label>
        <Input
          id="themes"
          type="text"
          placeholder="e.g., grace, salvation, worship"
          disabled={isSubmitting}
          {...register('themes')}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate multiple themes with commas
        </p>
        <ThemeSuggestions
          suggestions={suggestedThemes}
          selectedThemes={selectedThemes}
          onSelect={handleThemeSuggestionSelect}
        />
      </div>

      {/* Copyright field (optional) */}
      <div>
        <Label htmlFor="copyright">Copyright</Label>
        <Input
          id="copyright"
          type="text"
          placeholder="e.g., © 2024 Publisher Name"
          disabled={isSubmitting}
          {...register('copyright')}
        />
      </div>

      {/* Lyrics field (optional textarea) */}
      <div>
        <Label htmlFor="lyrics">Lyrics</Label>
        <textarea
          id="lyrics"
          className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter the song lyrics"
          disabled={isSubmitting}
          {...register('lyrics')}
          onBlur={(e) => setLyricsForSuggestion(e.target.value)}
        />
        {errors.lyrics && (
          <p id="lyrics-error" className="text-sm text-destructive mt-1">
            {errors.lyrics.message}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || (!isDirty && origin === (initialData.origin || ''))}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
