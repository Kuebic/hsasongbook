import songsData from '../data/songs.json'
import arrangementsData from '../data/arrangements.json'

// Cache the data for performance
const dataCache = {
  songs: null,
  arrangements: null,
  songArrangementMap: null
}

// Initialize cache
function initializeCache() {
  if (!dataCache.songs) {
    dataCache.songs = songsData
    dataCache.arrangements = arrangementsData

    // Create a map for quick lookups
    dataCache.songArrangementMap = arrangementsData.reduce((map, arr) => {
      if (!map[arr.songId]) {
        map[arr.songId] = []
      }
      map[arr.songId].push(arr)
      return map
    }, {})
  }
}

export function getAllSongs() {
  initializeCache()
  return dataCache.songs
}

export function getSongById(id) {
  initializeCache()
  return dataCache.songs.find(song => song.id === id)
}

export function getArrangementsBySongId(songId) {
  try {
    initializeCache()
    return dataCache.songArrangementMap[songId] || []
  } catch (error) {
    console.error('Error fetching arrangements:', error)
    return []
  }
}

export function getArrangementById(id) {
  initializeCache()
  return dataCache.arrangements.find(arr => arr.id === id)
}

export function getSongWithArrangements(songId) {
  const song = getSongById(songId)
  if (!song) return null

  return {
    ...song,
    arrangements: getArrangementsBySongId(songId)
  }
}

export function searchSongs(searchTerm) {
  if (!searchTerm?.trim()) return getAllSongs()

  const search = searchTerm.toLowerCase()
  return getAllSongs().filter(song =>
    song.title.toLowerCase().includes(search) ||
    song.artist.toLowerCase().includes(search) ||
    song.themes?.some(theme => theme.toLowerCase().includes(search))
  )
}

// For backwards compatibility during migration
export function getLegacyFormatSongs() {
  initializeCache()
  return dataCache.songs.map(song => {
    const arrangements = getArrangementsBySongId(song.id)
    const defaultArr = arrangements[0] || {}
    return {
      ...song,
      id: parseInt(song.id.replace('song_', '')),
      key: defaultArr.key || 'C',
      tempo: defaultArr.tempo?.toString() || '72',
      lyrics: song.lyrics?.en || ''
    }
  })
}