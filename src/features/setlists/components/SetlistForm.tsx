/**
 * SetlistForm Component
 *
 * Controlled form for creating and editing setlist metadata.
 * Features inline validation with error display.
 */

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ChipInput from '@/features/shared/components/ChipInput';
import { validateSetlist } from '../utils/setlistValidation';
import { SETLIST_TAG_SUGGESTIONS } from '../utils/setlistTagConstants';
import SetlistPrivacySelector from './SetlistPrivacySelector';
import { SetlistTagSuggestions } from './SetlistTagSuggestions';
import type { SetlistFormData, SetlistValidationErrors } from '../types';

interface SetlistFormProps {
  initialData?: Partial<SetlistFormData>;
  onSubmit: (data: SetlistFormData) => void;
  onCancel: () => void;
}

export default function SetlistForm({
  initialData,
  onSubmit,
  onCancel
}: SetlistFormProps) {
  const [formData, setFormData] = useState<SetlistFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    performanceDate: initialData?.performanceDate || '',
    privacyLevel: initialData?.privacyLevel || 'private',
    tags: initialData?.tags || [],
    estimatedDuration: initialData?.estimatedDuration,
    difficulty: initialData?.difficulty,
  });

  const [errors, setErrors] = useState<SetlistValidationErrors | null>(null);

  // Fetch existing tags for autocomplete
  const existingTags = useQuery(api.setlists.getDistinctTags);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    const validationErrors = validateSetlist(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors(null);
    onSubmit(formData);
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData({ ...formData, tags });
  };

  const handleAddTag = (tag: string) => {
    const currentTags = formData.tags ?? [];
    if (!currentTags.includes(tag)) {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Setlist Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Sunday Worship - Jan 15, 2025"
          aria-invalid={errors?.name ? 'true' : 'false'}
          aria-describedby={errors?.name ? 'name-error' : undefined}
        />
        {errors?.name && (
          <p id="name-error" className="text-sm text-destructive mt-1">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Morning service setlist"
          aria-invalid={errors?.description ? 'true' : 'false'}
          aria-describedby={errors?.description ? 'description-error' : undefined}
        />
        {errors?.description && (
          <p id="description-error" className="text-sm text-destructive mt-1">
            {errors.description}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="performanceDate">Performance Date</Label>
        <Input
          id="performanceDate"
          type="date"
          value={formData.performanceDate}
          onChange={(e) => setFormData({ ...formData, performanceDate: e.target.value })}
          aria-invalid={errors?.performanceDate ? 'true' : 'false'}
          aria-describedby={errors?.performanceDate ? 'date-error' : undefined}
        />
        {errors?.performanceDate && (
          <p id="date-error" className="text-sm text-destructive mt-1">
            {errors.performanceDate}
          </p>
        )}
      </div>

      {/* Privacy Selector */}
      <SetlistPrivacySelector
        value={formData.privacyLevel ?? 'private'}
        onChange={(value) => setFormData({ ...formData, privacyLevel: value })}
      />

      {/* Tags Input */}
      <div>
        <ChipInput
          label="Tags"
          value={formData.tags || []}
          onChange={handleTagsChange}
          suggestions={[...SETLIST_TAG_SUGGESTIONS]}
          dynamicSuggestions={existingTags || []}
          allowCustom={true}
          placeholder="Add tags..."
          helperText="Select from suggestions or create your own"
          chipVariant="tag"
        />
        <SetlistTagSuggestions
          selectedTags={formData.tags || []}
          onSelectTag={handleAddTag}
        />
      </div>

      {/* Estimated Duration */}
      <div>
        <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
        <Input
          id="estimatedDuration"
          type="number"
          min={0}
          max={240}
          inputMode="numeric"
          value={formData.estimatedDuration ?? ''}
          onChange={(e) => setFormData({
            ...formData,
            estimatedDuration: e.target.value ? parseInt(e.target.value, 10) : undefined
          })}
          placeholder="e.g., 45"
        />
      </div>

      {/* Difficulty Selector */}
      <div>
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          value={formData.difficulty ?? ''}
          onValueChange={(value) => {
            // Type-safe difficulty validation
            const validDifficulties = ['beginner', 'intermediate', 'advanced'] as const;
            type Difficulty = typeof validDifficulties[number];
            const difficulty = validDifficulties.includes(value as Difficulty)
              ? (value as Difficulty)
              : undefined;
            setFormData({ ...formData, difficulty });
          }}
        >
          <SelectTrigger id="difficulty">
            <SelectValue placeholder="Select difficulty..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
