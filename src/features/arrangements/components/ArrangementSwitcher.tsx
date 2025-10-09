import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Music, Check } from 'lucide-react'
import type { Arrangement } from '@/types'

interface ArrangementSwitcherProps {
  currentArrangement: Arrangement;
  allArrangements: Arrangement[];
  songTitle: string;
}

export default function ArrangementSwitcher({
  currentArrangement,
  allArrangements,
  songTitle
}: ArrangementSwitcherProps) {
  const navigate = useNavigate()

  const handleSwitch = (arrangementId: string): void => {
    if (arrangementId !== currentArrangement.id) {
      navigate(`/arrangement/${arrangementId}`)
    }
  }

  if (!allArrangements || allArrangements.length <= 1) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Music className="mr-2 h-4 w-4" />
          {currentArrangement.name}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{songTitle}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allArrangements.map((arrangement) => (
          <DropdownMenuItem
            key={arrangement.id}
            onClick={() => handleSwitch(arrangement.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Music className="h-3 w-3" />
                <span>{arrangement.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({arrangement.key})
                </span>
              </div>
              {arrangement.id === currentArrangement.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
