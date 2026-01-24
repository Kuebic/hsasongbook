/**
 * ArrangementCountFilter Component
 *
 * Dropdown for filtering by minimum arrangement count.
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MIN_ARRANGEMENT_OPTIONS } from '../utils/filterConstants';

interface ArrangementCountFilterProps {
  value: number;
  onChange: (count: number) => void;
}

export default function ArrangementCountFilter({ value, onChange }: ArrangementCountFilterProps) {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Min. Arrangements</Label>
      <Select
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val, 10))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Any" />
        </SelectTrigger>
        <SelectContent>
          {MIN_ARRANGEMENT_OPTIONS.map(({ value: optValue, label }) => (
            <SelectItem key={optValue} value={optValue.toString()}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
