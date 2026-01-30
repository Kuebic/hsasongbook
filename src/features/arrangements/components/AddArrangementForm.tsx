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
import InstrumentSelector from './InstrumentSelector';
import EnergySelector from './EnergySelector';
import StyleSelector from './StyleSelector';
import {
  addArrangementSchema,
  type AddArrangementFormData,
  type DifficultyOption,
} from '../validation/arrangementSchemas';
import type { Id } from '../../../../convex/_generated/dataModel';
import { extractErrorMessage } from '@/lib/utils';
import OwnerSelector, { type OwnerSelection } from '@/features/shared/components/OwnerSelector';
import CoAuthorPicker, { type CoAuthor } from '@/features/shared/components/CoAuthorPicker';
import ChipInput from '@/features/shared/components/ChipInput';
import {
  TAG_SUGGESTIONS,
  SETTING_OPTIONS,
  type InstrumentOption,
  type EnergyOption,
  type StyleOption,
} from '@/features/shared';
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
  // New structured categorization fields
  const [instrument, setInstrument] = useState<InstrumentOption | undefined>();
  const [energy, setEnergy] = useState<EnergyOption | undefined>();
  const [style, setStyle] = useState<StyleOption | undefined>();
  const [settings, setSettings] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

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

      // Tags are already managed as an array via ChipInput

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
        // Structured categorization fields
        instrument,
        energy,
        style,
        settings: settings.length > 0 ? settings : undefined,
        // Phase 2: Pass ownership and co-authors info
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        coAuthors: coAuthorData,
      });

      // Success - navigate to the new arrangement in edit mode
      onSuccess?.();
      navigate(`/song/${songSlug}/${slug}`, { state: { openEditor: true } });
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

      {/* Instrument and Energy row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="instrument">Instrument</Label>
          <InstrumentSelector
            value={instrument}
            onChange={setInstrument}
            disabled={isSubmitting}
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor="energy">Energy</Label>
          <EnergySelector
            value={energy}
            onChange={setEnergy}
            disabled={isSubmitting}
            className="w-full"
          />
        </div>
      </div>

      {/* Style field */}
      <div>
        <Label htmlFor="style">Style</Label>
        <StyleSelector
          value={style}
          onChange={setStyle}
          disabled={isSubmitting}
          className="w-full"
        />
      </div>

      {/* Settings field (multi-select chips) */}
      <ChipInput
        label="Settings"
        value={settings}
        onChange={setSettings}
        suggestions={SETTING_OPTIONS.map((opt) => opt.value)}
        allowCustom={false}
        placeholder="Select settings..."
        helperText="Where/how this arrangement is intended to be used"
        disabled={isSubmitting}
        chipVariant="setting"
      />

      {/* Tags field (chip-based autocomplete) */}
      <ChipInput
        label="Tags"
        value={tags}
        onChange={setTags}
        suggestions={[...TAG_SUGGESTIONS]}
        allowCustom={true}
        placeholder="Add tags..."
        helperText="Additional labels for categorization"
        disabled={isSubmitting}
        chipVariant="tag"
      />

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
