import { useState } from 'react'
import songs from '../../shared/data/songs.json'
import SongList from '../components/SongList'
import SearchBar from '../components/SearchBar'

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <h1>Worship Songbook</h1>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <SongList songs={filteredSongs} />
    </div>
  )
}
