import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  getArrangementById,
  getSongById,
  getArrangementsBySongId
} from '../../shared/utils/dataHelpers'
import ChordProViewer from '../components/ChordProViewer'
import ArrangementSwitcher from '../components/ArrangementSwitcher'
import ArrangementHeader from '../components/ArrangementHeader'
import Breadcrumbs from '../../shared/components/Breadcrumbs'
import { PageSpinner } from '../../shared/components/LoadingStates'
import { SimplePageTransition } from '../../shared/components/PageTransition'
import { useNavigation } from '../../shared/hooks/useNavigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Music, Eye, EyeOff } from 'lucide-react'

export function ArrangementPage() {
  const { arrangementId } = useParams()
  const navigate = useNavigate()
  const { breadcrumbs } = useNavigation()

  const [arrangement, setArrangement] = useState(null)
  const [song, setSong] = useState(null)
  const [allArrangements, setAllArrangements] = useState([])
  const [showChords, setShowChords] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      setLoading(true)

      // For backward compatibility, check if it's an old song ID format
      const id = arrangementId
      let arrangementData = null

      // Try to get as arrangement first
      arrangementData = getArrangementById(id)

      if (!arrangementData) {
        setError('Arrangement not found')
        setLoading(false)
        return
      }

      // Get parent song
      const songData = getSongById(arrangementData.songId)
      if (!songData) {
        setError('Parent song not found')
        setLoading(false)
        return
      }

      // Get all arrangements for this song
      const siblingArrangements = getArrangementsBySongId(arrangementData.songId)

      setArrangement(arrangementData)
      setSong(songData)
      setAllArrangements(siblingArrangements)
      setError(null)
    } catch (err) {
      setError('Failed to load arrangement')
      console.error('Error loading arrangement:', err)
    } finally {
      setLoading(false)
    }
  }, [arrangementId])

  // Loading state
  if (loading) {
    return <PageSpinner message="Loading arrangement..." />
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
    )
  }

  return (
    <SimplePageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <Breadcrumbs items={breadcrumbs} />

            {/* Arrangement Switcher */}
            <ArrangementSwitcher
              currentArrangement={arrangement}
              allArrangements={allArrangements}
              songTitle={song.title}
            />
          </div>

        {/* Arrangement Header */}
        <div className="mb-6">
          <ArrangementHeader
            arrangement={arrangement}
            songTitle={song.title}
            artist={song.artist}
          />
        </div>

        {/* Chord Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChords(!showChords)}
          >
            {showChords ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Chords
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Chords
              </>
            )}
          </Button>
        </div>

        {/* ChordPro Content */}
        <div className="mb-8">
          <ChordProViewer
            content={arrangement.chordProContent}
            showChords={showChords}
          />
        </div>

        {/* Navigation Footer */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/song/${song.id}`)}
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
                    onClick={() => navigate(`/arrangement/${arr.id}`)}
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
  )
}
