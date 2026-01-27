/**
 * SetlistForm Component
 *
 * Controlled form for creating and editing setlist metadata.
 * Features inline validation with error display.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { validateSetlist } from '../utils/setlistValidation';
import SetlistPrivacySelector from './SetlistPrivacySelector';
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

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<SetlistValidationErrors | null>(null);

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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      const currentTags = formData.tags ?? [];
      if (!currentTags.includes(newTag)) {
        setFormData({ ...formData, tags: [...currentTags, newTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string): void => {
    const currentTags = formData.tags ?? [];
    setFormData({
      ...formData,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    });
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
        />
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
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tags (press Enter)"
        />
        {(formData.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
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
          onValueChange={(value) => setFormData({
            ...formData,
            difficulty: value as 'beginner' | 'intermediate' | 'advanced' | undefined
          })}
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
