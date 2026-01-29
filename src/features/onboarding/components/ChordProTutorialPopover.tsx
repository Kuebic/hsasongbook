/**
 * ChordProTutorialPopover Component
 *
 * Contextual tutorial popover showing ChordPro basics.
 * Triggered on first edit attempt or via the help button.
 */

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface ChordProTutorialPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGotIt: () => void;
  children?: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export default function ChordProTutorialPopover({
  open,
  onOpenChange,
  onGotIt,
  children,
  side = 'bottom',
  align = 'end',
}: ChordProTutorialPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {children && <PopoverTrigger asChild>{children}</PopoverTrigger>}
      <PopoverContent
        side={side}
        align={align}
        className="w-80 p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Quick ChordPro Basics</h4>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Add chords above lyrics</strong> by
              wrapping them in brackets:
            </p>
            <code className="block bg-muted px-2 py-1 rounded text-xs font-mono">
              [G]Amazing [D]grace
            </code>

            <p className="pt-1">
              <strong className="text-foreground">Common directives:</strong>
            </p>
            <ul className="text-xs space-y-0.5 pl-2">
              <li>
                <code className="bg-muted px-1 rounded">{'{title: Song Name}'}</code> - Song title
              </li>
              <li>
                <code className="bg-muted px-1 rounded">{'{key: G}'}</code> - Musical key
              </li>
              <li>
                <code className="bg-muted px-1 rounded">{'{soc}'}</code> / <code className="bg-muted px-1 rounded">{'{eoc}'}</code> - Start/end of chorus
              </li>
              <li>
                <code className="bg-muted px-1 rounded">{'{comment: text}'}</code> - Add a note
              </li>
            </ul>

            <p className="pt-1 text-xs">
              The app handles transposition automatically when you change keys.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://www.chordpro.org/chordpro/chordpro-cheat_sheet/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Learn more
            </a>
            <Button size="sm" onClick={onGotIt}>
              Got it
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
