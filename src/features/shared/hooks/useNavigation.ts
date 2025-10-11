import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { SongRepository, ArrangementRepository } from '../../pwa/db/repository'

export interface Breadcrumb {
  label: string
  path: string
}

export interface UseNavigationReturn {
  breadcrumbs: Breadcrumb[]
  goToSearch: () => void
  goToSong: (songSlug: string) => void
  goToArrangement: (songSlug: string, arrangementSlug: string) => void
  goBack: () => void
  navigate: (path: string | number) => void
  currentPath: string
}

export function useNavigation(): UseNavigationReturn {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])

  useEffect(() => {
    const loadBreadcrumbs = async () => {
      const path = location.pathname
      const crumbs: Breadcrumb[] = []

      // Parse current location for breadcrumbs
      if (path.includes('/song/')) {
        const songSlug = params.songSlug
        if (songSlug) {
          const songRepo = new SongRepository()
          const song = await songRepo.getBySlug(songSlug)
          if (song) {
            crumbs.push({
              label: song.title,
              path: `/song/${song.slug}`
            })

            // Check if we're also on an arrangement page
            const arrangementSlug = params.arrangementSlug
            if (arrangementSlug) {
              const arrRepo = new ArrangementRepository()
              const arrangement = await arrRepo.getBySlug(arrangementSlug)
              if (arrangement) {
                crumbs.push({
                  label: arrangement.name,
                  path: `/song/${song.slug}/${arrangement.slug}`
                })
              }
            }
          }
        }
      }

      setBreadcrumbs(crumbs)
    }

    loadBreadcrumbs()
  }, [location.pathname, params.songSlug, params.arrangementSlug])

  const goToSearch = (): void => navigate('/')
  const goToSong = (songSlug: string): void => navigate(`/song/${songSlug}`)
  const goToArrangement = (songSlug: string, arrangementSlug: string): void => navigate(`/song/${songSlug}/${arrangementSlug}`)
  const goBack = (): void => navigate(-1)

  return {
    breadcrumbs,
    goToSearch,
    goToSong,
    goToArrangement,
    goBack,
    navigate,
    currentPath: location.pathname
  }
}