import { useState } from 'react'
import ArrangementCard from './ArrangementCard'
import SortSelector from '../../shared/components/SortSelector'
import { sortArrangements, SORT_OPTIONS } from '../../shared/utils/arrangementSorter'

export default function ArrangementList({ arrangements }) {
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.POPULAR)

  if (!arrangements || arrangements.length === 0) {
    return null
  }

  const sortedArrangements = sortArrangements(arrangements, sortBy)

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          Available Arrangements ({arrangements.length})
        </h3>
        <SortSelector value={sortBy} onChange={setSortBy} />
      </div>

      {/* Arrangement grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedArrangements.map((arrangement) => (
          <ArrangementCard
            key={arrangement.id}
            arrangement={arrangement}
          />
        ))}
      </div>
    </div>
  )
}