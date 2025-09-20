import { useParams, Link, useNavigate } from 'react-router-dom'
import songs from '../../shared/data/songs.json'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Music, User, Clock, Hash } from 'lucide-react'

export function SongViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const song = songs.find(s => s.id === parseInt(id))

  if (!song) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Song not found
            </CardTitle>
            <CardDescription>
              The song you're looking for doesn't exist
            </CardDescription>
          </CardHeader>
          <CardContent>
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to search
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl sm:text-3xl mb-2">
                  {song.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  {song.artist}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-sm">
                  Key: {song.key}
                </Badge>
                {song.tempo && (
                  <Badge variant="secondary" className="text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {song.tempo} BPM
                  </Badge>
                )}
              </div>
            </div>
            {song.themes && song.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {song.themes.map((theme, index) => (
                  <Badge key={index} variant="outline" className="capitalize">
                    <Hash className="h-3 w-3 mr-1" />
                    {theme}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap font-mono text-sm sm:text-base leading-relaxed">
                {song.lyrics}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            {songs.find(s => s.id === song.id - 1) && (
              <Button
                variant="outline"
                onClick={() => navigate(`/song/${song.id - 1}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            {songs.find(s => s.id === song.id + 1) && (
              <Button
                variant="outline"
                onClick={() => navigate(`/song/${song.id + 1}`)}
              >
                Next
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            )}
          </div>
          <Button onClick={() => navigate('/')}>
            Back to all songs
          </Button>
        </div>
      </div>
    </div>
  )
}