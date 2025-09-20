import { Link } from 'react-router-dom'

export default function SongList({ songs }) {
  return (
    <div className="song-list">
      {songs.map(song => (
        <Link
          key={song.id}
          to={`/song/${song.id}`}
          className="song-item"
        >
          <h3>{song.title}</h3>
        </Link>
      ))}
    </div>
  )
}