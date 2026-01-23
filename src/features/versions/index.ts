/**
 * Version History Feature Module
 * Provides version history and rollback functionality for Community-owned content.
 */

// Hooks
export { useVersionHistory } from './hooks/useVersionHistory';
export { useIsCommunityGroupModerator, useCanAccessVersionHistory } from './hooks/useIsCommunityGroupModerator';

// Components
export { default as VersionHistoryPanel } from './components/VersionHistoryPanel';
export { default as VersionHistoryList } from './components/VersionHistoryList';
export { default as VersionItem } from './components/VersionItem';
export { default as RollbackConfirmDialog } from './components/RollbackConfirmDialog';
