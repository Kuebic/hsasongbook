/**
 * Setlists Feature Module
 *
 * Public API exports for the setlist management feature
 */

// Pages
export { SetlistsIndexPage } from './pages/SetlistsIndexPage';
export { SetlistPage } from './pages/SetlistPage';
export { SetlistPerformancePage } from './pages/SetlistPerformancePage';

// Components
export { default as SetlistCard } from './components/SetlistCard';
export { default as SetlistList } from './components/SetlistList';
export { default as SetlistForm } from './components/SetlistForm';
export { default as SetlistSongItem } from './components/SetlistSongItem';
export { default as PerformanceControls } from './components/PerformanceControls';
export { default as PerformanceProgressBar } from './components/PerformanceProgressBar';

// Hooks
export { useSetlists } from './hooks/useSetlists';
export { useSetlistData } from './hooks/useSetlistData';
export { useSetlistSongs } from './hooks/useSetlistSongs';
export { useSetlistSearch } from './hooks/useSetlistSearch';
export { useFullscreen } from './hooks/useFullscreen';
export { useArrowKeyNavigation } from './hooks/useArrowKeyNavigation';
export { usePerformanceMode } from './hooks/usePerformanceMode';

// Utils
export { sortSetlists } from './utils/setlistSorter';
export { validateSetlist } from './utils/setlistValidation';

// Types
export type {
  Setlist,
  SetlistSong,
  SetlistSortOption,
  SetlistValidationErrors,
  SetlistFormData
} from './types';
