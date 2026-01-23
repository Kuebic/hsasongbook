import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useArrangementData } from '../hooks/useArrangementData';
import { useArrangementPermissions } from '../hooks/useArrangementPermissions';
import { useArrangementCoAuthors } from '../hooks/useArrangementCoAuthors';
import ChordProViewer from '@/features/chordpro';
import ArrangementSwitcher from '../components/ArrangementSwitcher';
import ArrangementHeader from '../components/ArrangementHeader';
import ArrangementMetadataForm from '../components/ArrangementMetadataForm';
import CollaboratorsDialog from '../components/CollaboratorsDialog';
import CoAuthorsList from '../components/CoAuthorsList';
import { ArrangementOwnershipActions } from '../components/ArrangementOwnershipActions';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import { PageSpinner } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { useNavigation } from '../../shared/hooks/useNavigation';
import { VersionHistoryPanel } from '@/features/versions';
import { Button } from '@/components/ui/button';
import logger from '@/lib/logger';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Music, Printer, Users } from 'lucide-react';
import { sanitizeChordProContent } from '@/features/chordpro/utils/contentSanitizer';
import type { ArrangementMetadata } from '@/types/Arrangement.types';

export function ArrangementPage() {
  const navigate = useNavigate();
  const { arrangementSlug } = useParams();
  const { breadcrumbs } = useNavigation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCollaboratorsDialog, setShowCollaboratorsDialog] = useState(false);
  const [showChords, setShowChords] = useState(true);

  // Use Convex hook to load arrangement data (uses URL slug automatically)
  const {
    arrangement,
    song,
    allArrangements,
    loading,
    error,
    updateArrangement
  } = useArrangementData();

  // Check permissions for the current arrangement
  const { canEdit, isOwner, isOriginalCreator, loading: permissionsLoading } = useArrangementPermissions(
    arrangement?.id ?? null
  );

  // Fetch arrangement with creator info in a single query
  const arrangementWithCreator = useQuery(
    api.arrangements.getBySlugWithCreator,
    arrangementSlug ? { slug: arrangementSlug } : 'skip'
  );

  // Extract creator and owner from the combined query result
  const creator = useMemo(() => {
    return arrangementWithCreator?.creator ?? null;
  }, [arrangementWithCreator]);

  // Phase 2: Extract owner info from query result
  const owner = useMemo(() => {
    return arrangementWithCreator?.owner ?? null;
  }, [arrangementWithCreator]);

  // Check if arrangement is owned by Community group (system group)
  const isCommunityOwned =
    arrangementWithCreator?.ownerType === 'group' &&
    owner?.type === 'group' &&
    owner?.isSystemGroup === true;

  // Phase 2: Fetch co-authors for group-owned arrangements
  const { coAuthors, loading: coAuthorsLoading } = useArrangementCoAuthors(
    arrangement?.id ?? null
  );

  // Auto-enable edit mode when arrangement has no content AND user can edit
  useEffect(() => {
    if (arrangement && !arrangement.chordProContent && canEdit) {
      setIsEditMode(true);
    }
  }, [arrangement, canEdit]);

  // Loading state (include permissions loading)
  if (loading || permissionsLoading) {
    return <PageSpinner message="Loading arrangement..." />;
  }

  // Error state
  if (error || !arrangement || !song) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {error || 'Arrangement not found'}
              </h2>
              <p className="text-muted-foreground text-sm">
                The arrangement you're looking for doesn't exist
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-screen-2xl">
          {/* Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
            <Breadcrumbs items={breadcrumbs} />

            <div className="flex gap-2 items-center">
              {/* Ownership transfer/reclaim (only for original creator) */}
              <ArrangementOwnershipActions
                arrangementId={arrangement?.id ?? ''}
                isOwner={isOriginalCreator}
                isCommunityOwned={isCommunityOwned}
              />

              {/* Collaborators Button (owner only) */}
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCollaboratorsDialog(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Collaborators
                </Button>
              )}

              {/* Print Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>

              {/* Arrangement Switcher */}
              <ArrangementSwitcher
                currentArrangement={arrangement}
                allArrangements={allArrangements}
                songTitle={song.title}
                songSlug={song.slug}
              />
            </div>
          </div>

        {/* Arrangement Header */}
        <div className="mb-6">
          <ArrangementHeader
            arrangement={arrangement}
            songTitle={song.title}
            artist={song.artist}
            creator={creator}
            owner={owner}
          />
        </div>

        {/* Phase 2: Co-authors list (for group-owned arrangements) */}
        {coAuthors.length > 0 && (
          <div className="mb-6 no-print">
            <CoAuthorsList coAuthors={coAuthors} />
          </div>
        )}

        {/* Metadata Form - Only show in edit mode when user can edit */}
        {isEditMode && canEdit && (
          <div className="mb-6 no-print">
            <ArrangementMetadataForm
              metadata={{
                key: arrangement.key,
                tempo: arrangement.tempo,
                timeSignature: arrangement.timeSignature,
                capo: arrangement.capo
              }}
              onChange={async (newMetadata: ArrangementMetadata) => {
                logger.debug('Metadata changed, saving to Convex:', newMetadata);
                // Save metadata via useArrangementData hook
                const result = await updateArrangement(newMetadata);
                if (result.success) {
                  logger.debug('Metadata saved to Convex successfully');
                } else {
                  logger.error('Failed to save metadata:', result.error);
                }
              }}
            />
          </div>
        )}

        {/* ChordPro Content */}
        <div className="mb-8">
          <ChordProViewer
            content={arrangement.chordProContent || ''}
            showChords={showChords}
            showToggle={true}
            editable={canEdit}
            editMode={isEditMode && canEdit}
            onEditModeChange={setIsEditMode}
            arrangementMetadata={{
              key: arrangement.key,
              tempo: arrangement.tempo,
              timeSignature: arrangement.timeSignature,
              capo: arrangement.capo
            }}
            onContentChange={async (newContent: string) => {
              // Strip metadata directives before saving (controlled via dropdowns)
              const sanitizedContent = sanitizeChordProContent(newContent);

              logger.debug('ChordPro content changed, saving sanitized content to Convex:', sanitizedContent.length);

              // Save via useArrangementData hook
              const result = await updateArrangement({
                chordProContent: sanitizedContent
              });
              if (result.success) {
                logger.debug('Content saved to Convex successfully');
              } else {
                logger.error('Failed to save content:', result.error);
              }
            }}
            onLoad={(metadata) => {
              // Optional: Log or use metadata
              logger.debug('ChordPro metadata:', metadata);
            }}
          />
        </div>

        {/* Version History Panel (Community group moderators only) */}
        <VersionHistoryPanel
          contentType="arrangement"
          contentId={arrangement.id}
          ownerType={arrangement.ownerType}
        />

        {/* Navigation Footer */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between no-print">
          <Button
            variant="outline"
            onClick={() => navigate(`/song/${song.slug}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {song.title}
          </Button>

          {/* Quick arrangement navigation */}
          {allArrangements.length > 1 && (
            <div className="flex gap-2">
              {allArrangements
                .filter(arr => arr.id !== arrangement.id)
                .slice(0, 2)
                .map(arr => (
                  <Button
                    key={arr.id}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/song/${song.slug}/${arr.slug}`)}
                  >
                    {arr.name} ({arr.key})
                  </Button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Collaborators Dialog (owner only) */}
    {isOwner && arrangement && (
      <CollaboratorsDialog
        open={showCollaboratorsDialog}
        onOpenChange={setShowCollaboratorsDialog}
        arrangementId={arrangement.id}
        arrangementName={arrangement.name}
      />
    )}
    </SimplePageTransition>
  );
}
