import React, { memo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useConvex } from 'convex/react'
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
import { Music, Clock, Guitar, Hash, Users, Globe, MoreVertical, Copy, Trash2, Play, Pause, Loader2 } from 'lucide-react'
import FavoriteButton from '../../shared/components/FavoriteButton'
import { getCreatorDisplayName } from '../../shared/utils/userDisplay'
import { DuplicateArrangementDialog } from './DuplicateArrangementDialog'
import { DeleteArrangementDialog } from './DeleteArrangementDialog'
import { useAudioPlayer } from '@/features/audio'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)

  // Audio player integration
  const convex = useConvex()
  const { playTrack, track: currentTrack, isPlaying, pause } = useAudioPlayer()

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

  // Check if THIS arrangement is currently playing in the global player
  const isThisPlaying = currentTrack?.arrangementSlug === arrangement.slug && isPlaying;

  // Handle play button click - fetch audio URL and play
  const handlePlayClick = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation(); // Prevent card navigation

    // If this track is playing, pause it
    if (isThisPlaying) {
      pause();
      return;
    }

    // Fetch signed URL and play
    setIsLoadingAudio(true);
    try {
      const audioUrl = await convex.query(
        api.files.getArrangementAudioUrl,
        { arrangementId: arrangement.id as Id<'arrangements'> }
      );

      if (!audioUrl) {
        console.error('No audio URL returned for arrangement:', arrangement.id);
        return;
      }

      playTrack({
        audioUrl,
        songTitle: resolvedSongTitle || 'Unknown Song',
        arrangementName: arrangement.name,
        arrangementSlug: arrangement.slug,
        songSlug: resolvedSongSlug || '',
      });
    } catch (err) {
      console.error('Failed to fetch audio URL:', err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

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
    <Card
      className="h-full flex flex-col hover:shadow-lg transition-all duration-200 hover:scale-[1.01] hover:-translate-y-1 cursor-pointer"
      onClick={handleViewArrangement}
    >
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

          {/* Play button, favorite button and actions menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Play button - only show if arrangement has audio */}
            {arrangement.audioFileKey && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
                onClick={handlePlayClick}
                aria-label={isThisPlaying ? 'Pause' : 'Play audio'}
              >
                {isLoadingAudio ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isThisPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
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
          <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-1">
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
