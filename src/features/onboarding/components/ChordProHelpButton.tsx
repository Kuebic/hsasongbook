/**
 * ChordProHelpButton Component
 *
 * Persistent "?" button that opens the ChordPro tutorial popover.
 * Provides refresher access to tutorial content anytime.
 */

import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import ChordProTutorialPopover from './ChordProTutorialPopover';

interface ChordProHelpButtonProps {
  isPopoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onGotIt: () => void;
}

export default function ChordProHelpButton({
  isPopoverOpen,
  onPopoverOpenChange,
  onGotIt,
}: ChordProHelpButtonProps) {
  return (
    <ChordProTutorialPopover
      open={isPopoverOpen}
      onOpenChange={onPopoverOpenChange}
      onGotIt={onGotIt}
      side="bottom"
      align="end"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="ChordPro help"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
    </ChordProTutorialPopover>
  );
}
