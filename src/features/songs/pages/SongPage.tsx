import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSlugParams } from '../../shared/hooks/useSlugParams';
import { SongRepository, ArrangementRepository } from '../../pwa/db/repository';
import SongMetadata from '../components/SongMetadata';
import ArrangementList from '../../arrangements/components/ArrangementList';
import Breadcrumbs from '../../shared/components/Breadcrumbs';
import { PageSpinner } from '../../shared/components/LoadingStates';
import { SimplePageTransition } from '../../shared/components/PageTransition';
import { useNavigation } from '../../shared/hooks/useNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Music } from 'lucide-react';
import type { Song } from '@/types/Song.types';
import type { Arrangement } from '@/types/Arrangement.types';

export function SongPage() {
  const { songId, isLoading: isResolvingSlug } = useSlugParams();
  const navigate = useNavigate();
  const { breadcrumbs } = useNavigation();
  const [song, setSong] = useState<Song | null>(null);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!songId) return;

    const loadSongData = async () => {
      try {
        setLoading(true);
        const songRepo = new SongRepository();
        const arrRepo = new ArrangementRepository();

        const songData = await songRepo.getById(songId);

        if (!songData) {
          setError('Song not found');
          setLoading(false);
          return;
        }

        const arrangementData = await arrRepo.getBySong(songId);

        setSong(songData);
        setArrangements(arrangementData);
        setError(null);
      } catch (err) {
        setError('Failed to load song');
        console.error('Error loading song:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSongData();
  }, [songId]);

  // Loading state (slug resolution or data loading)
  if (isResolvingSlug || loading) {
    return <PageSpinner message="Loading song details..." />;
  }

  // Error state
  if (error || !song) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {error || 'Song not found'}
              </h2>
              <p className="text-muted-foreground text-sm">
                The song you're looking for doesn't exist or couldn't be loaded
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Improved Navigation */}
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          {/* Song Metadata */}
          <div className="mb-8">
            <SongMetadata song={song} />
          </div>

          {/* Arrangements Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Available Arrangements ({arrangements.length})
            </h2>

            {arrangements.length > 0 ? (
              <ArrangementList
                arrangements={arrangements}
                songSlug={song.slug}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No arrangements available for this song yet
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SimplePageTransition>
  );
}
