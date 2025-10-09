import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getSongById, getArrangementById } from '../../shared/utils/dataHelpers'

export interface Breadcrumb {
  label: string
  path: string
}

export interface UseNavigationReturn {
  breadcrumbs: Breadcrumb[]
  goToSearch: () => void
  goToSong: (songId: string) => void
  goToArrangement: (arrangementId: string) => void
  goBack: () => void
  currentPath: string
}

export function useNavigation(): UseNavigationReturn {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])

  useEffect(() => {
    const path = location.pathname
    const crumbs: Breadcrumb[] = []

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

  const goToSearch = (): void => navigate('/')
  const goToSong = (songId: string): void => navigate(`/song/${songId}`)
  const goToArrangement = (arrangementId: string): void => navigate(`/arrangement/${arrangementId}`)
  const goBack = (): void => navigate(-1)

  return {
    breadcrumbs,
    goToSearch,
    goToSong,
    goToArrangement,
    goBack,
    currentPath: location.pathname
  }
}