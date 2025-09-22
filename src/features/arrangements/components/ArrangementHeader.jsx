import { Badge } from '@/components/ui/badge'
import { Clock, Music, Guitar, Hash } from 'lucide-react'

export default function ArrangementHeader({ arrangement, songTitle, artist }) {
  return (
    <div className="space-y-4">
      {/* Title and Artist */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {songTitle}
          {arrangement.name !== 'Default' && (
            <span className="text-muted-foreground font-normal">
              {' '}– {arrangement.name}
            </span>
          )}
        </h1>
        <p className="text-muted-foreground text-lg mt-1">{artist}</p>
      </div>

      {/* Musical Properties */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-sm">
          <Music className="h-3 w-3 mr-1" />
          Key: {arrangement.key}
        </Badge>

        {arrangement.tempo && (
          <Badge variant="secondary" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            {arrangement.tempo} BPM
          </Badge>
        )}

        {arrangement.timeSignature && (
          <Badge variant="secondary" className="text-sm">
            {arrangement.timeSignature}
          </Badge>
        )}

        {arrangement.capo > 0 && (
          <Badge variant="outline" className="text-sm">
            <Guitar className="h-3 w-3 mr-1" />
            Capo {arrangement.capo}
          </Badge>
        )}
      </div>

      {/* Tags */}
      {arrangement.tags && arrangement.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {arrangement.tags
            .filter(tag => tag !== 'default')
            .map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs capitalize">
                <Hash className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
        </div>
      )}
    </div>
  )
}