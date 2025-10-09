import { Heart } from 'lucide-react'

interface PopularityDisplayProps {
  favorites?: number
}

export default function PopularityDisplay({ favorites = 0 }: PopularityDisplayProps) {
  // Format large numbers
  const formatCount = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Heart className="h-4 w-4" />
      <span className="text-sm">{formatCount(favorites)}</span>
    </div>
  )
}