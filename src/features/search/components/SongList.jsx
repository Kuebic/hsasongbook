import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Music, User, Clock } from 'lucide-react'

export default function SongList({ songs }) {
  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">No songs found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search terms
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map(song => (
        <Link
          key={song.id}
          to={`/song/${song.id}`}
          className="block transition-transform hover:scale-[1.02] focus:scale-[1.02]"
        >
          <Card className="h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="line-clamp-1">{song.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <User className="h-3 w-3" />
                {song.artist}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Key: {song.key}
                </Badge>
                {song.tempo && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {song.tempo} BPM
                  </Badge>
                )}
              </div>
              {song.themes && song.themes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {song.themes.slice(0, 3).map((theme, index) => (
                    <Badge key={index} variant="outline" className="text-xs capitalize">
                      {theme}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {song.lyrics.split('\n')[0]}...
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}