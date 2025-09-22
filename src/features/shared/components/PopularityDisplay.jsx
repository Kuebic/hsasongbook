import { Heart } from 'lucide-react'

export default function PopularityDisplay({ favorites = 0 }) {
  // Format large numbers
  const formatCount = (num) => {
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