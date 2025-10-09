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
import { validateSetlist } from '../utils/setlistValidation';
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
    performanceDate: initialData?.performanceDate || ''
  });

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

      <div className="flex gap-2 pt-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
