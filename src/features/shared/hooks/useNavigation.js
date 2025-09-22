import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getSongById, getArrangementById } from '../../shared/utils/dataHelpers'

export function useNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [breadcrumbs, setBreadcrumbs] = useState([])

  useEffect(() => {
    const path = location.pathname
    const crumbs = []

    // Parse current location for breadcrumbs
    if (path.includes('/song/')) {
      const song = getSongById(params.songId)
      if (song) {
        crumbs.push({
          label: song.title,
          path: `/song/${params.songId}`
        })
      }
    } else if (path.includes('/arrangement/')) {
      const arrangement = getArrangementById(params.arrangementId)
      if (arrangement) {
        const song = getSongById(arrangement.songId)
        if (song) {
          crumbs.push({
            label: song.title,
            path: `/song/${song.id}`
          })
          crumbs.push({
            label: arrangement.name,
            path: `/arrangement/${arrangement.id}`
          })
        }
      }
    }

    setBreadcrumbs(crumbs)
  }, [location.pathname, params.songId, params.arrangementId])

  const goToSearch = () => navigate('/')
  const goToSong = (songId) => navigate(`/song/${songId}`)
  const goToArrangement = (arrangementId) => navigate(`/arrangement/${arrangementId}`)
  const goBack = () => navigate(-1)

  return {
    breadcrumbs,
    goToSearch,
    goToSong,
    goToArrangement,
    goBack,
    currentPath: location.pathname
  }
}