import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Music, User, Hash } from 'lucide-react'
import { getArrangementsBySongId } from '../../shared/utils/dataHelpers'

export default function SongList({ songs }) {
  if (!songs || songs.length === 0) {
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
      {songs.map(song => {
        const arrangements = getArrangementsBySongId(song.id)
        const defaultArrangement = arrangements[0]

        return (
          <Link
            key={song.id}
            to={`/song/${song.id}`}
            className="block transition-transform hover:scale-[1.02]"
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
                <div className="flex flex-wrap gap-2">
                  {defaultArrangement && (
                    <Badge variant="secondary" className="text-xs">
                      Key: {defaultArrangement.key}
                    </Badge>
                  )}
                  {arrangements.length > 1 && (
                    <Badge variant="outline" className="text-xs">
                      {arrangements.length} arrangements
                    </Badge>
                  )}
                  {song.themes?.slice(0, 2).map((theme, index) => (
                    <Badge key={index} variant="outline" className="text-xs capitalize">
                      <Hash className="h-3 w-3 mr-1" />
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}