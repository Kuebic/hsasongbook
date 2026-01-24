import { useState, useMemo } from 'react'
import ArrangementCard from './ArrangementCard'
import SortSelector from '../../shared/components/SortSelector'
import { sortArrangements, SORT_OPTIONS } from '../utils/arrangementSorter'
import { Card, CardContent } from '@/components/ui/card'
import { Music2 } from 'lucide-react'
import logger from '@/lib/logger'
import { useAuth } from '@/features/auth'
import type { Arrangement, ArrangementWithCreator, SortOption } from '@/types'

interface ArrangementListProps {
  arrangements: (Arrangement | ArrangementWithCreator)[];
  songSlug: string;
  isLoading?: boolean;
  onArrangementDeleted?: () => void;
}

export default function ArrangementList({ arrangements, songSlug, isLoading = false, onArrangementDeleted }: ArrangementListProps) {
  const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS.POPULAR)
  const { user } = useAuth()
  const isAuthenticated = user && !user.isAnonymous
  const currentUserId = user?.id

  // Memoize sorted arrangements to prevent unnecessary re-sorting
  const sortedArrangements = useMemo(() => {
    if (!arrangements || arrangements.length === 0) return []

    const startTime = performance.now()
    const sorted = sortArrangements(arrangements, sortBy)
    const endTime = performance.now()

    // Log performance in development
    logger.debug(`Sort operation took ${(endTime - startTime).toFixed(2)}ms`)

    return sorted
  }, [arrangements, sortBy])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-36 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-64">
              <CardContent className="p-6 space-y-3">
                <div className="h-6 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="space-y-2 mt-4">
                  <div className="h-8 bg-muted animate-pulse rounded" />
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!arrangements || arrangements.length === 0) {
    return (
      <Card className="p-8">
        <CardContent className="flex flex-col items-center text-center space-y-3">
          <Music2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No Arrangements Available</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            There are no arrangements for this song yet. Check back later or create your own!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="flex justify-end mb-4">
        <SortSelector value={sortBy} onChange={setSortBy} />
      </div>

      {/* Arrangement grid - responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sortedArrangements.map((arrangement) => {
          // Check if current user is the owner (creator) of this arrangement
          const creatorId = 'creator' in arrangement ? arrangement.creator?._id : arrangement.userId;
          const isOwner = !!currentUserId && creatorId === currentUserId;

          return (
            <ArrangementCard
              key={arrangement.id}
              arrangement={arrangement}
              songSlug={songSlug}
              isOwner={isOwner}
              isAuthenticated={!!isAuthenticated}
              onDeleted={onArrangementDeleted}
            />
          );
        })}
      </div>
    </div>
  )
}
