import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSlugParams } from '../../shared/hooks/useSlugParams';
import { useArrangementData } from '../hooks/useArrangementData';
import ChordProViewer from '@/features/chordpro';
import ArrangementSwitcher from '../components/ArrangementSwitcher';
import ArrangementHeader from '../components/ArrangementHeader';
import ArrangementMetadataForm from '../components/ArrangementMetadataForm';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import { PageSpinner } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { useNavigation } from '../../shared/hooks/useNavigation';
import { Button } from '@/components/ui/button';
import logger from '@/lib/logger';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Music, Printer } from 'lucide-react';
import { sanitizeChordProContent } from '@/features/chordpro/utils/contentSanitizer';
import type { ArrangementMetadata } from '@/types/Arrangement.types';

export function ArrangementPage() {
  const { arrangementId, isLoading: isResolvingSlug } = useSlugParams();
  const navigate = useNavigate();
  const { breadcrumbs } = useNavigation();
  const [showChords] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Use IndexedDB hook instead of mock data
  const {
    arrangement,
    song,
    allArrangements,
    loading,
    error,
    updateArrangement
  } = useArrangementData(arrangementId);

  // Loading state (slug resolution or data loading)
  if (isResolvingSlug || loading) {
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
          />
        </div>

        {/* Metadata Form - Only show in edit mode */}
        {isEditMode && (
          <div className="mb-6 no-print">
            <ArrangementMetadataForm
              metadata={{
                key: arrangement.key,
                tempo: arrangement.tempo,
                timeSignature: arrangement.timeSignature,
                capo: arrangement.capo
              }}
              onChange={async (newMetadata: ArrangementMetadata) => {
                logger.debug('Metadata changed, saving to IndexedDB:', newMetadata);
                // Save metadata via useArrangementData hook
                const result = await updateArrangement(newMetadata);
                if (result.success) {
                  logger.debug('Metadata saved to IndexedDB successfully');
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
            editable={true}
            editMode={isEditMode}
            onEditModeChange={setIsEditMode}
            arrangementId={arrangementId}
            arrangementMetadata={{
              key: arrangement.key,
              tempo: arrangement.tempo,
              timeSignature: arrangement.timeSignature,
              capo: arrangement.capo
            }}
            onContentChange={async (newContent: string) => {
              // Strip metadata directives before saving (controlled via dropdowns)
              const sanitizedContent = sanitizeChordProContent(newContent);

              logger.debug('ChordPro content changed, saving sanitized content to IndexedDB:', sanitizedContent.length);

              // Save via useArrangementData hook
              const result = await updateArrangement({
                chordProContent: sanitizedContent
              });
              if (result.success) {
                logger.debug('Content saved to IndexedDB successfully');
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
    </SimplePageTransition>
  );
}
