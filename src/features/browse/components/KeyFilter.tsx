/**
 * KeyFilter Component
 *
 * Dropdown for filtering by musical key.
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MUSICAL_KEYS } from '../utils/filterConstants';

interface KeyFilterProps {
  value: string | null;
  onChange: (key: string | null) => void;
}

export default function KeyFilter({ value, onChange }: KeyFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Has Key</Label>
      <Select
        value={value || 'any'}
        onValueChange={(val) => onChange(val === 'any' ? null : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any key" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any key</SelectItem>
          {MUSICAL_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
