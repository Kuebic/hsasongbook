/**
 * Shared Module Barrel Export
 * Centralizes all shared exports for cleaner imports.
 *
 * Usage:
 * ```tsx
 * import { OwnerSelector, CoAuthorPicker } from '@/features/shared';
 * ```
 */

// Components
export { default as OwnerSelector } from './components/OwnerSelector';
export { default as CoAuthorPicker } from './components/CoAuthorPicker';
export { default as Breadcrumbs } from './components/Breadcrumbs';
export { default as EmptyState } from './components/EmptyState';
export { PageSpinner, SongListSkeleton } from './components/LoadingStates';
export { SimplePageTransition } from './components/PageTransition';
export { default as PopularityDisplay } from './components/PopularityDisplay';
export { default as RatingDisplay } from './components/RatingDisplay';
export { default as SortSelector } from './components/SortSelector';

// Hooks
export { useNavigation } from './hooks/useNavigation';
export { useDebounce } from './hooks/useDebounce';
export { useSlugParams } from './hooks/useSlugParams';
export { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Utils
export { getDisplayName, getCreatorDisplayName } from './utils/userDisplay';
export { generateSlug } from './utils/slugGenerator';
export { parseCommaSeparatedTags } from './utils/dataHelpers';
export { formatDateString, formatTimestamp, formatSetlistDate } from './utils/dateFormatter';
export { mapConvexSongToFrontend } from './utils/songMappers';
export { DIFFICULTY_OPTIONS } from './utils/constants';

// Types
export type { OwnerSelection } from './components/OwnerSelector';
export type { CoAuthor } from './components/CoAuthorPicker';
export type { ConvexSongDocument } from './utils/songMappers';
export type { DifficultyOption } from './utils/constants';
