import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, TrendingUp, Star, Clock, History } from 'lucide-react'
import { SORT_OPTIONS } from '../utils/arrangementSorter'

export default function SortSelector({ value, onChange }) {
  const options = [
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
        <Button variant="outline" size="sm" className="min-w-[150px]">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          {currentOption.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {options.map(option => {
          const Icon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className="cursor-pointer"
            >
              <Icon className="mr-2 h-4 w-4" />
              {option.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}