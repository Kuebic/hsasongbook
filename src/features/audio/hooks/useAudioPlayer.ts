/**
 * useAudioPlayer Hook
 *
 * Custom hook to access the global audio player context.
 * Must be used within an AudioPlayerProvider.
 */

import { useContext } from 'react';
import { AudioPlayerContext } from '../context/AudioPlayerContext';

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
