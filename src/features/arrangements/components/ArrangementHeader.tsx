import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Clock, Music, Guitar, Hash, Users, Globe } from 'lucide-react'
import { getCreatorDisplayName } from '../../shared/utils/userDisplay'
import type { Arrangement, CreatorInfo, OwnerInfo } from '@/types'

interface ArrangementHeaderProps {
  arrangement: Arrangement;
  songTitle: string;
  artist: string;
  creator?: CreatorInfo | null;
  owner?: OwnerInfo | null;
  transposedKey?: string;      // Current key after transposition
  transpositionOffset?: number; // How many semitones transposed
}

export default function ArrangementHeader({ arrangement, songTitle, artist, creator, owner, transposedKey, transpositionOffset }: ArrangementHeaderProps) {
  // Phase 2: Determine if this is a group-owned or Community arrangement
  const isGroupOwned = owner?.type === 'group';
  const isCommunityGroup = isGroupOwned && owner?.isSystemGroup === true;

  // Check if transposed
  const isTransposed = transpositionOffset !== undefined && transpositionOffset !== 0;
  const displayKey = transposedKey || arrangement.key;

  // Render owner attribution based on ownership type
  const renderOwnerAttribution = () => {
    if (isCommunityGroup) {
      // Community group - show special badge
      return (
        <>
          {' · '}
          <span className="inline-flex items-center gap-1 text-primary font-medium">
            <Globe className="h-4 w-4" />
            Community (Crowdsourced)
          </span>
        </>
      );
    }

    if (isGroupOwned && owner?.slug) {
      // Group-owned - link to group page
      return (
        <>
          {' · By '}
          <Link
            to={`/groups/${owner.slug}`}
            className="inline-flex items-center gap-1 hover:text-foreground hover:underline transition-colors"
          >
            <Users className="h-4 w-4" />
            {owner.name}
          </Link>
        </>
      );
    }

    // User-owned or fallback - show creator
    if (creator?.username) {
      return (
        <>
          {' · Arranged by '}
          <Link
            to={`/user/${creator.username}`}
            className="hover:text-foreground hover:underline transition-colors"
          >
            {getCreatorDisplayName(creator)}
          </Link>
        </>
      );
    }

    return null;
  };

  return (
    <div className="print-header space-y-4">
      {/* Title row with musical properties */}
      <div className="print-title-row">
        <h1 className="print-title text-2xl sm:text-3xl font-bold">
          {songTitle}
          <span className="print-arrangement-name text-muted-foreground font-normal">
            {' '}– {arrangement.name}
          </span>
        </h1>

        {/* Musical Properties - inline on print */}
        <div className="print-musical-props flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-sm">
            <Music className="h-3 w-3 mr-1" />
            {isTransposed ? (
              <>Key: {arrangement.key} → {displayKey}</>
            ) : (
              <>Key: {displayKey}</>
            )}
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
      </div>

      {/* Artist attribution */}
      <p className="print-artist text-muted-foreground text-lg mt-1">
        {artist}
        {renderOwnerAttribution()}
      </p>

      {/* Tags - hidden in print */}
      {arrangement.tags && arrangement.tags.length > 0 && (
        <div className="print-tags flex flex-wrap gap-1">
          {arrangement.tags.map((tag, index) => (
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
