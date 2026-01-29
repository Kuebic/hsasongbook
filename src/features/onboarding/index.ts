/**
 * Onboarding Module Barrel Export
 *
 * Provides welcome modal and ChordPro tutorial features for new users.
 */

// Hooks
export { useOnboardingState } from './hooks/useOnboardingState';
export { useChordProTutorial } from './hooks/useChordProTutorial';

// Components
export { default as WelcomeModal } from './components/WelcomeModal';
export { default as ChordProTutorialPopover } from './components/ChordProTutorialPopover';
export { default as ChordProHelpButton } from './components/ChordProHelpButton';
