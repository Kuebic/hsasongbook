import { memo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Music, Clock, Guitar, Hash, PlayCircle, Users, Globe, MoreVertical, Copy, Trash2 } from 'lucide-react'
import FavoriteButton from '../../shared/components/FavoriteButton'
import { getCreatorDisplayName } from '../../shared/utils/userDisplay'
import { DuplicateArrangementDialog } from './DuplicateArrangementDialog'
import { DeleteArrangementDialog } from './DeleteArrangementDialog'
import type { ArrangementWithCreator, ArrangementWithSongAndCreator } from '@/types'

interface ArrangementCardProps {
  arrangement: ArrangementWithCreator | ArrangementWithSongAndCreator;
  songSlug?: string; // Optional - can be inferred from arrangement.song if available
  isOwner?: boolean; // Whether current user owns this arrangement
  isAuthenticated?: boolean; // Whether user is logged in (non-anonymous)
  onDeleted?: () => void; // Called after successful deletion
}

function ArrangementCard({ arrangement, songSlug, isOwner, isAuthenticated, onDeleted }: ArrangementCardProps) {
  const navigate = useNavigate()
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Type guard: Check if arrangement includes embedded song data
  const hasEmbeddedSong = 'song' in arrangement;

  // Resolve songSlug from embedded data or props
  const resolvedSongSlug = hasEmbeddedSong ? arrangement.song.slug : songSlug;
  const resolvedSongTitle = hasEmbeddedSong ? arrangement.song.title : undefined;

  // Determine owner display (Phase 2: Groups)
  const isGroupOwned = arrangement.owner?.type === 'group';
  const isCommunityGroup = isGroupOwned && arrangement.owner?.isSystemGroup === true;
  const ownerName = arrangement.owner?.name;
  const ownerSlug = arrangement.owner?.slug;

  const handleViewArrangement = (): void => {
    if (!resolvedSongSlug) {
      console.error('ArrangementCard: Missing song slug for arrangement', arrangement.id);
      return;
    }
    navigate(`/song/${resolvedSongSlug}/${arrangement.slug}`)
  }

  // Render the "by" attribution
  const renderAttribution = () => {
    // Community group - show special badge (no link)
    if (isCommunityGroup) {
      return (
        <span className="text-sm text-primary font-medium mt-1 inline-flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Community (Crowdsourced)
        </span>
      );
    }

    // If group-owned, show group name
    if (isGroupOwned && ownerName) {
      return (
        <Link
          to={ownerSlug ? `/groups/${ownerSlug}` : '#'}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Users className="h-3 w-3" />
          By {ownerName}
        </Link>
      );
    }

    // Default: show creator username
    if (arrangement.creator?.username) {
      return (
        <Link
          to={`/user/${arrangement.creator.username}`}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors mt-1 inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          by {getCreatorDisplayName(arrangement.creator)}
        </Link>
      );
    }

    return null;
  };

  return (
    <>
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 hover:scale-[1.01] hover:-translate-y-1 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 font-semibold flex-1">
            {resolvedSongTitle ? (
              <>
                <span className="text-muted-foreground">{resolvedSongTitle}</span>
                <span className="mx-2 text-muted-foreground/60">—</span>
                <span>{arrangement.name}</span>
              </>
            ) : (
              <span>{arrangement.name}</span>
            )}
          </CardTitle>

          {/* Favorite button and actions menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <FavoriteButton
              targetType="arrangement"
              targetId={arrangement.id}
              count={arrangement.favorites}
              size="sm"
            />
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDuplicateDialog(true)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          </div>
        </div>
        {renderAttribution()}
        <CardDescription className="space-y-1 mt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Music className="h-3 w-3 opacity-70" />
            <span className="text-sm">Key: {arrangement.key}</span>
          </div>
          {arrangement.capo > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Guitar className="h-3 w-3 opacity-70" />
              <span className="text-sm">Capo: {arrangement.capo}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="space-y-3">
          {/* Musical properties */}
          <div className="flex flex-wrap gap-2 pb-3 border-b border-border/40">
            <Badge variant="secondary" className="text-xs font-medium">
              <Clock className="h-3 w-3 mr-1" />
              {arrangement.tempo} BPM
            </Badge>
            {arrangement.timeSignature && (
              <Badge variant="secondary" className="text-xs font-medium">
                {arrangement.timeSignature}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {arrangement.tags && arrangement.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {arrangement.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs capitalize hover:bg-muted transition-colors"
                >
                  <Hash className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action button */}
        <Button
          onClick={handleViewArrangement}
          className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          size="sm"
          variant="outline"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          View Arrangement
        </Button>
      </CardContent>
    </Card>

    {/* Dialogs rendered outside the card */}
    {resolvedSongSlug && (
      <>
        <DuplicateArrangementDialog
          sourceArrangement={{
            id: arrangement.id,
            name: arrangement.name,
          }}
          songSlug={resolvedSongSlug}
          open={showDuplicateDialog}
          onOpenChange={setShowDuplicateDialog}
          showTrigger={false}
        />
        <DeleteArrangementDialog
          arrangementId={arrangement.id}
          arrangementName={arrangement.name}
          isOwner={!!isOwner}
          onDeleted={onDeleted}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          showTrigger={false}
        />
      </>
    )}
    </>
  )
}

export default memo(ArrangementCard)
