/**
 * AddSongForm Component
 * Phase 5.3: Add Song/Arrangement Forms
 *
 * Form for creating a new song with validation.
 * Uses React Hook Form with Zod validation.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { AlertCircle } from 'lucide-react';
import { addSongSchema, type AddSongFormData, SONG_ORIGIN_GROUPS } from '../validation/songSchemas';
import { generateSlug } from '@/features/shared/utils/slugGenerator';
import { parseCommaSeparatedTags } from '@/features/shared/utils/dataHelpers';
import { extractErrorMessage } from '@/lib/utils';
import OwnerSelector, { type OwnerSelection } from '@/features/shared/components/OwnerSelector';
import { suggestThemes } from '@/lib/themeSuggester';
import { ThemeSuggestions } from './ThemeSuggestions';
import { useDuplicateDetection } from '../hooks/useDuplicateDetection';
import { DuplicateWarning } from './DuplicateWarning';
import { ArtistInput } from './ArtistInput';

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
  // Phase 2: Owner selection state
  const [owner, setOwner] = useState<OwnerSelection>({ ownerType: 'user' });
  // Origin selection state
  const [origin, setOrigin] = useState<string>('');
  // Theme suggestion state
  const [lyricsForSuggestion, setLyricsForSuggestion] = useState<string>('');
  const [themesInput, setThemesInput] = useState<string>('');
  // Artist input state (controlled for autocomplete)
  const [artistInput, setArtistInput] = useState<string>('');

  // Compute theme suggestions from lyrics (updates on blur)
  const suggestedThemes = useMemo(
    () => suggestThemes(lyricsForSuggestion),
    [lyricsForSuggestion]
  );
  const selectedThemes = useMemo(
    () => parseCommaSeparatedTags(themesInput),
    [themesInput]
  );

  const handleThemeSuggestionSelect = (theme: string) => {
    const newThemes = themesInput ? `${themesInput}, ${theme}` : theme;
    setThemesInput(newThemes);
  };

  const {
    register,
    handleSubmit,
    watch,
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

  // Watch title for duplicate detection
  const titleValue = watch('title');
  const { duplicates, isChecking } = useDuplicateDetection(titleValue);

  const onSubmit = async (data: AddSongFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Parse themes from comma-separated string
      const themes = parseCommaSeparatedTags(themesInput);

      // Generate slug from title
      const slug = generateSlug(data.title, 'song');

      // Create song via Convex mutation
      await createSong({
        title: data.title,
        artist: artistInput || undefined,
        themes,
        copyright: undefined,
        lyrics: data.lyrics || undefined,
        origin: origin || undefined,
        slug,
        // Phase 2: Pass ownership info
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
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

      {/* Phase 2: Owner selector (only shows if user has postable groups) */}
      <OwnerSelector
        value={owner}
        onChange={setOwner}
        disabled={isSubmitting}
      />

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
        {/* Duplicate warning */}
        <DuplicateWarning duplicates={duplicates} isChecking={isChecking} />
      </div>

      {/* Artist field (optional) with autocomplete */}
      <div>
        <Label htmlFor="artist">Artist</Label>
        <ArtistInput
          id="artist"
          value={artistInput}
          onChange={setArtistInput}
          disabled={isSubmitting}
          placeholder="e.g., John Newton"
        />
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
          value={themesInput}
          onChange={(e) => setThemesInput(e.target.value)}
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

      {/* Lyrics field (optional textarea) */}
      <div>
        <Label htmlFor="lyrics">Lyrics</Label>
        <textarea
          id="lyrics"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter the song lyrics (optional)"
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
