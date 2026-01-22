import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

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

  // Query song by slug if on a song page
  const song = useQuery(
    api.songs.getBySlug,
    params.songSlug ? { slug: params.songSlug } : 'skip'
  )

  // Query arrangement by slug if on an arrangement page
  const arrangement = useQuery(
    api.arrangements.getBySlug,
    params.arrangementSlug ? { slug: params.arrangementSlug } : 'skip'
  )

  // Build breadcrumbs based on queries
  const breadcrumbs: Breadcrumb[] = []

  if (song) {
    breadcrumbs.push({
      label: song.title,
      path: `/song/${song.slug}`
    })

    if (arrangement) {
      breadcrumbs.push({
        label: arrangement.name,
        path: `/song/${song.slug}/${arrangement.slug}`
      })
    }
  }

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
