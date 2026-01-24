/**
 * AddArrangementForm Component
 * Phase 5.3: Add Song/Arrangement Forms
 *
 * Minimal metadata form for creating a new arrangement.
 * Like Planning Center Services: name, key, tags, capo.
 * ChordPro content is edited in the arrangement page after creation.
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { nanoid } from 'nanoid';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import KeySelector from '@/features/chordpro/components/KeySelector';
import CapoSelector from './CapoSelector';
import DifficultySelector from './DifficultySelector';
import {
  addArrangementSchema,
  type AddArrangementFormData,
  type DifficultyOption,
} from '../validation/arrangementSchemas';
import type { Id } from '../../../../convex/_generated/dataModel';
import { parseCommaSeparatedTags } from '@/features/shared/utils/dataHelpers';
import { extractErrorMessage } from '@/lib/utils';
import OwnerSelector, { type OwnerSelection } from '@/features/shared/components/OwnerSelector';
import CoAuthorPicker, { type CoAuthor } from '@/features/shared/components/CoAuthorPicker';
import { useAuth } from '@/features/auth';

interface AddArrangementFormProps {
  songId: string;
  songSlug: string;
  songLyrics?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * AddArrangementForm - Minimal metadata form for creating a new arrangement
 *
 * Usage:
 * ```tsx
 * <AddArrangementForm
 *   songId={song.id}
 *   songSlug={song.slug}
 *   onSuccess={() => setDialogOpen(false)}
 *   onCancel={() => setDialogOpen(false)}
 * />
 * ```
 */
export default function AddArrangementForm({
  songId,
  songSlug,
  songLyrics,
  onSuccess,
  onCancel,
}: AddArrangementFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createArrangement = useMutation(api.arrangements.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Phase 2: Owner selection and co-authors state
  const [owner, setOwner] = useState<OwnerSelection>({ ownerType: 'user' });
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AddArrangementFormData>({
    resolver: zodResolver(addArrangementSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      key: 'C',
      capo: 0,
      difficulty: undefined,
      tags: [],
    },
  });

  const onSubmit = async (data: AddArrangementFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Parse tags from comma-separated string
      const tagsInput =
        (document.getElementById('arrangement-tags') as HTMLInputElement)?.value || '';
      const tags = parseCommaSeparatedTags(tagsInput);

      // Generate random 6-char slug for arrangements
      const slug = nanoid(6);

      // Generate initial ChordPro content from song lyrics if available
      const initialChordProContent = songLyrics ? songLyrics.trim() : '';

      // Phase 2: Prepare co-authors for the mutation
      const coAuthorData = owner.ownerType === 'group' && coAuthors.length > 0
        ? coAuthors.map((author) => ({
            userId: author.userId as Id<'users'>,
            isPrimary: author.isPrimary,
          }))
        : undefined;

      // Create arrangement via Convex mutation
      await createArrangement({
        songId: songId as Id<'songs'>,
        name: data.name,
        key: data.key || undefined,
        capo: data.capo,
        difficulty: data.difficulty,
        timeSignature: '4/4', // Default
        chordProContent: initialChordProContent,
        slug,
        tags,
        // Phase 2: Pass ownership and co-authors info
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        coAuthors: coAuthorData,
      });

      // Success - navigate to the new arrangement
      onSuccess?.();
      navigate(`/song/${songSlug}/${slug}`);
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
        onChange={(newOwner) => {
          setOwner(newOwner);
          // Clear co-authors when switching back to user ownership
          if (newOwner.ownerType === 'user') {
            setCoAuthors([]);
          }
        }}
        disabled={isSubmitting}
      />

      {/* Phase 2: Co-author picker (only for group-owned arrangements) */}
      {owner.ownerType === 'group' && user && (
        <CoAuthorPicker
          selectedAuthors={coAuthors}
          onChange={setCoAuthors}
          currentUserId={user._id}
          disabled={isSubmitting}
        />
      )}

      {/* Name field (required) */}
      <div>
        <Label htmlFor="name">Arrangement Name *</Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., Traditional Hymn, Modern Version, Acoustic"
          disabled={isSubmitting}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive mt-1">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Key, Capo, and Difficulty row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Key field */}
        <div>
          <Label htmlFor="key">Key</Label>
          <Controller
            name="key"
            control={control}
            render={({ field }) => (
              <KeySelector
                value={field.value || 'C'}
                onChange={field.onChange}
                disabled={isSubmitting}
                className="w-full"
              />
            )}
          />
        </div>

        {/* Capo field */}
        <div>
          <Label htmlFor="capo">Capo</Label>
          <Controller
            name="capo"
            control={control}
            render={({ field }) => (
              <CapoSelector
                value={field.value || 0}
                onChange={field.onChange}
                disabled={isSubmitting}
                className="w-full"
              />
            )}
          />
        </div>

        {/* Difficulty field */}
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <DifficultySelector
                value={field.value as DifficultyOption | undefined}
                onChange={field.onChange}
                disabled={isSubmitting}
                className="w-full"
              />
            )}
          />
        </div>
      </div>

      {/* Tags field (comma-separated) */}
      <div>
        <Label htmlFor="arrangement-tags">Tags</Label>
        <Input
          id="arrangement-tags"
          type="text"
          placeholder="e.g., worship, acoustic, beginner"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate multiple tags with commas
        </p>
      </div>

      {/* Info about ChordPro editing */}
      <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
        After creating the arrangement, you'll be taken to the editor where you can add the
        ChordPro content, tempo, and time signature.
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Arrangement'}
        </Button>
      </div>
    </form>
  );
}
