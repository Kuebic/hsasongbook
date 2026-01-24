/**
 * SortSelector Component
 *
 * Dropdown for selecting sort order on the browse page.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDownAZ, ArrowUpAZ, Clock, Star, TrendingUp } from 'lucide-react';
import { SORT_OPTIONS, type SortOption } from '../utils/filterConstants';

interface SortSelectorProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

const SORT_ICONS: Record<SortOption, typeof TrendingUp> = {
  popular: TrendingUp,
  rating: Star,
  newest: Clock,
  oldest: Clock,
  alphabetical: ArrowDownAZ,
  alphabetical_desc: ArrowUpAZ,
};

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  const Icon = SORT_ICONS[value];

  return (
    <Select value={value} onValueChange={(val) => onChange(val as SortOption)}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SORT_OPTIONS).map(([key, { label }]) => {
          const ItemIcon = SORT_ICONS[key as SortOption];
          return (
            <SelectItem key={key} value={key} className="min-h-[44px]">
              <div className="flex items-center gap-2">
                <ItemIcon className="h-4 w-4" />
                <span>{label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
