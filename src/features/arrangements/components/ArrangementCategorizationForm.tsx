/**
 * ArrangementCategorizationForm Component
 *
 * Form for editing arrangement categorization fields
 * (instrument, energy, style, settings, tags)
 * Auto-saves changes with debouncing
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import InstrumentSelector from './InstrumentSelector';
import EnergySelector from './EnergySelector';
import StyleSelector from './StyleSelector';
import ChipInput from '@/features/shared/components/ChipInput';
import {
  TAG_SUGGESTIONS,
  SETTING_OPTIONS,
  type InstrumentOption,
  type EnergyOption,
  type StyleOption,
} from '@/features/shared';

// Debounce helper function
function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export interface CategorizationData {
  instrument?: InstrumentOption;
  energy?: EnergyOption;
  style?: StyleOption;
  settings?: string[];
  tags?: string[];
}

interface ArrangementCategorizationFormProps {
  data: CategorizationData;
  onChange?: (data: CategorizationData) => void;
  disabled?: boolean;
  className?: string;
}

export default function ArrangementCategorizationForm({
  data,
  onChange,
  disabled = false,
  className,
}: ArrangementCategorizationFormProps) {
  // Local form state
  const [formState, setFormState] = useState<CategorizationData>({
    instrument: data?.instrument,
    energy: data?.energy,
    style: data?.style as StyleOption | undefined,
    settings: data?.settings || [],
    tags: data?.tags || [],
  });

  const [isDirty, setIsDirty] = useState(false);

  // Fetch existing tags for autocomplete suggestions
  const existingTags = useQuery(api.arrangements.getDistinctTags);

  // Sync with parent data changes
  useEffect(() => {
    if (data) {
      setFormState({
        instrument: data.instrument,
        energy: data.energy,
        style: data.style as StyleOption | undefined,
        settings: data.settings || [],
        tags: data.tags || [],
      });
      setIsDirty(false);
    }
  }, [data]);

  // Debounced onChange callback
  const debouncedOnChange = useMemo(
    () =>
      debounce((newData: CategorizationData) => {
        onChange?.(newData);
        setIsDirty(false);
      }, 1000),
    [onChange]
  );

  // Handle field changes
  const handleChange = useCallback(
    <K extends keyof CategorizationData>(field: K, value: CategorizationData[K]) => {
      const newFormState = { ...formState, [field]: value };
      setFormState(newFormState);
      setIsDirty(true);
      debouncedOnChange(newFormState);
    },
    [formState, debouncedOnChange]
  );

  // Combine curated and existing tags for suggestions
  const tagSuggestions = useMemo(() => {
    const combined = [...TAG_SUGGESTIONS, ...(existingTags || [])];
    return [...new Set(combined)];
  }, [existingTags]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Categorization</CardTitle>
        <p className="text-sm text-muted-foreground">
          Help others find this arrangement with descriptive categories
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Instrument and Energy row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="instrument" className="text-sm font-medium">
              Instrument
            </Label>
            <InstrumentSelector
              value={formState.instrument}
              onChange={(value) => handleChange('instrument', value)}
              disabled={disabled}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="energy" className="text-sm font-medium">
              Energy
            </Label>
            <EnergySelector
              value={formState.energy}
              onChange={(value) => handleChange('energy', value)}
              disabled={disabled}
              className="w-full"
            />
          </div>
        </div>

        {/* Style field */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="style" className="text-sm font-medium">
            Style
          </Label>
          <StyleSelector
            value={formState.style}
            onChange={(value) => handleChange('style', value)}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Settings field (multi-select chips) */}
        <ChipInput
          label="Settings"
          value={formState.settings || []}
          onChange={(value) => handleChange('settings', value)}
          suggestions={SETTING_OPTIONS.map((opt) => opt.value)}
          allowCustom={false}
          placeholder="Select settings..."
          helperText="Where/how this arrangement is intended to be used"
          disabled={disabled}
          chipVariant="setting"
        />

        {/* Tags field (chip-based autocomplete) */}
        <ChipInput
          label="Tags"
          value={formState.tags || []}
          onChange={(value) => handleChange('tags', value)}
          suggestions={[...TAG_SUGGESTIONS]}
          dynamicSuggestions={tagSuggestions}
          allowCustom={true}
          placeholder="Add tags..."
          helperText="Additional labels for categorization"
          disabled={disabled}
          chipVariant="tag"
        />

        {/* Save status indicator */}
        {isDirty && (
          <div className="text-xs text-muted-foreground">Saving changes...</div>
        )}
      </CardContent>
    </Card>
  );
}
