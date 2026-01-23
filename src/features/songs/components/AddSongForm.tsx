/**
 * AddSongForm Component
 * Phase 5.3: Add Song/Arrangement Forms
 *
 * Form for creating a new song with validation.
 * Uses React Hook Form with Zod validation.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { addSongSchema, type AddSongFormData } from '../validation/songSchemas';
import { generateSlug } from '@/features/shared/utils/slugGenerator';
import { parseCommaSeparatedTags } from '@/features/shared/utils/dataHelpers';
import { extractErrorMessage } from '@/lib/utils';

interface AddSongFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * AddSongForm - Form for creating a new song
 *
 * Usage:
 * ```tsx
 * <AddSongForm
 *   onSuccess={() => setDialogOpen(false)}
 *   onCancel={() => setDialogOpen(false)}
 * />
 * ```
 */
export default function AddSongForm({ onSuccess, onCancel }: AddSongFormProps) {
  const navigate = useNavigate();
  const createSong = useMutation(api.songs.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddSongFormData>({
    resolver: zodResolver(addSongSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      artist: '',
      themes: [],
      lyrics: '',
    },
  });

  const onSubmit = async (data: AddSongFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Parse themes from comma-separated string
      const themesInput = (document.getElementById('themes') as HTMLInputElement)?.value || '';
      const themes = parseCommaSeparatedTags(themesInput);

      // Generate slug from title
      const slug = generateSlug(data.title, 'song');

      // Create song via Convex mutation
      await createSong({
        title: data.title,
        artist: data.artist || undefined,
        themes,
        copyright: undefined,
        lyrics: data.lyrics || undefined,
        slug,
      });

      // Success - navigate to the new song
      onSuccess?.();
      navigate(`/song/${slug}`);
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

      {/* Themes field (comma-separated) */}
      <div>
        <Label htmlFor="themes">Themes</Label>
        <Input
          id="themes"
          type="text"
          placeholder="e.g., grace, salvation, worship"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate multiple themes with commas
        </p>
      </div>

      {/* Lyrics field (optional textarea) */}
      <div>
        <Label htmlFor="lyrics">Lyrics</Label>
        <textarea
          id="lyrics"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter the song lyrics (optional)"
          disabled={isSubmitting}
          {...register('lyrics')}
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Song'}
        </Button>
      </div>
    </form>
  );
}
