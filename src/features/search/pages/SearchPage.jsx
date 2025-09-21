import { useState, useMemo } from 'react'
import songs from '../../shared/data/songs.json'
import SongList from '../components/SongList'
import SearchBar from '../components/SearchBar'

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSongs = useMemo(() => {
    if (!searchTerm.trim()) return songs

    const search = searchTerm.toLowerCase()
    return songs.filter(song =>
      song.title.toLowerCase().includes(search) ||
      song.artist.toLowerCase().includes(search) ||
      song.themes?.some(theme => theme.toLowerCase().includes(search))
    )
  }, [searchTerm])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            HSA Songbook
          </h1>
          <p className="text-muted-foreground">
            Search and discover worship songs
          </p>
        </header>

        <div className="mb-8">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'} found
          </p>
        </div>

        <SongList songs={filteredSongs} />
      </div>
    </div>
  )
}
