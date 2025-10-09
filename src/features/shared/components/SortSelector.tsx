import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, TrendingUp, Star, Clock, History, type LucideIcon } from 'lucide-react'
import { SORT_OPTIONS, type SortOption } from '../utils/constants'

interface SortSelectorProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

interface SortOptionConfig {
  value: SortOption
  label: string
  icon: LucideIcon
}

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  const options: SortOptionConfig[] = [
    {
      value: SORT_OPTIONS.POPULAR,
      label: 'Most Popular',
      icon: TrendingUp
    },
    {
      value: SORT_OPTIONS.RATING,
      label: 'Highest Rated',
      icon: Star
    },
    {
      value: SORT_OPTIONS.NEWEST,
      label: 'Newest First',
      icon: Clock
    },
    {
      value: SORT_OPTIONS.OLDEST,
      label: 'Oldest First',
      icon: History
    }
  ]

  const currentOption = options.find(opt => opt.value === value) || options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[150px] h-10 touch-manipulation focus:ring-2 focus:ring-offset-2"
        >
          <ArrowUpDown className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{currentOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[200px] max-h-[70vh] overflow-y-auto"
        sideOffset={5}
      >
        {options.map(option => {
          const Icon = option.icon
          const isActive = option.value === value
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`cursor-pointer min-h-[44px] flex items-center ${
                isActive ? 'bg-muted font-medium' : ''
              }`}
            >
              <Icon className={`mr-2 h-4 w-4 flex-shrink-0 ${
                isActive ? 'text-primary' : ''
              }`} />
              <span className="flex-1">{option.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}