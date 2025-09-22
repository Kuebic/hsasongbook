import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Skeleton component for loading states
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse bg-muted rounded-md", className)}
      {...props}
    />
  )
}

// Song card skeleton
export function SongCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// Song list skeleton
export function SongListSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SongCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Arrangement card skeleton
export function ArrangementCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-2/3 mb-2" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// ChordPro content skeleton
export function ChordProSkeleton() {
  return (
    <Card>
      <CardContent className="py-6 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1">
            {i % 3 === 0 && <Skeleton className="h-4 w-1/4 mb-1" />}
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Page loading spinner
export function PageSpinner({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto" />
        </div>
        <p className="text-muted-foreground mt-4">{message}</p>
      </div>
    </div>
  )
}