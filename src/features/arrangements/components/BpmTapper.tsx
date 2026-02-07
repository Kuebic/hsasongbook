/**
 * BpmTapper Component
 *
 * Tap-to-set BPM button. Measures intervals between taps,
 * averages them, and converts to BPM.
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface BpmTapperProps {
  onBpmChange: (bpm: number) => void;
  disabled?: boolean;
}

const MAX_TAPS = 8;
const RESET_TIMEOUT_MS = 2000;
const MIN_BPM = 20;
const MAX_BPM = 300;

export default function BpmTapper({ onBpmChange, disabled }: BpmTapperProps) {
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const tapsRef = useRef<number[]>([]);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTap = useCallback(() => {
    const now = Date.now();

    // Clear reset timer
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    // Add tap
    tapsRef.current.push(now);
    if (tapsRef.current.length > MAX_TAPS) {
      tapsRef.current = tapsRef.current.slice(-MAX_TAPS);
    }

    // Need at least 2 taps to calculate BPM
    if (tapsRef.current.length >= 2) {
      const taps = tapsRef.current;
      let totalInterval = 0;
      for (let i = 1; i < taps.length; i++) {
        totalInterval += taps[i] - taps[i - 1];
      }
      const avgInterval = totalInterval / (taps.length - 1);
      const bpm = Math.round(60000 / avgInterval);
      const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));

      setCurrentBpm(clampedBpm);
      onBpmChange(clampedBpm);
    }

    // Reset after inactivity
    resetTimerRef.current = setTimeout(() => {
      tapsRef.current = [];
      setCurrentBpm(null);
    }, RESET_TIMEOUT_MS);
  }, [onBpmChange]);

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-[44px] min-w-[44px] px-3 text-sm whitespace-nowrap"
      onClick={handleTap}
      disabled={disabled}
    >
      {currentBpm ? `${currentBpm}` : 'Tap'}
    </Button>
  );
}
