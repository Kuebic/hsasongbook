import { Star } from 'lucide-react'

interface RatingDisplayProps {
  rating: number | null | undefined
  showCount?: boolean
  ratingCount?: number
}

export default function RatingDisplay({
  rating,
  showCount = true,
  ratingCount = 0
}: RatingDisplayProps) {
  // Handle null rating
  if (rating === null || rating === undefined) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-sm">
        <span>No ratings yet</span>
      </div>
    )
  }

  // Create array of 5 stars
  const stars = Array(5).fill(0).map((_, i) => {
    const filled = i < Math.floor(rating)
    const halfFilled = i === Math.floor(rating) && rating % 1 >= 0.5
    return { filled, halfFilled }
  })

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}
    >
      {stars.map(({ filled }, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            filled
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground'
          }`}
        />
      ))}
      {showCount && (
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)}
          {ratingCount > 0 && ` (${ratingCount})`}
        </span>
      )}
    </div>
  )
}