import { useParams, Link } from 'react-router-dom'
import songs from '../../shared/data/songs.json'

export function SongViewPage() {
  const { id } = useParams()
  const song = songs.find(s => s.id === parseInt(id))

  if (!song) {
    return (
      <div>
        <h1>Song not found</h1>
        <Link to="/">Back to search</Link>
      </div>
    )
  }

  return (
    <div className="song-view">
      <Link to="/">ê Back to search</Link>
      <h1>{song.title}</h1>
      <div className="song-content">
        {song.lyrics}
      </div>
    </div>
  )
}