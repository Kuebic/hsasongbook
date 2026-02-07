/**
 * Live Preview
 *
 * Shows a sample chord/lyric snippet with current appearance settings applied.
 * Uses the same CSS classes as the real ChordPro viewer so styles stay in sync.
 */

import "../../chordpro/styles/chordpro.css";

interface LivePreviewProps {
  className?: string;
}

export function LivePreview({ className }: LivePreviewProps) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium text-muted-foreground">Preview</p>
      <div className="rounded-lg border bg-card p-4">
        <div className="chord-sheet-output font-mono">
          <div className="chord-sheet">
            {/* Line 1 */}
            <div className="row">
              <span className="column">
                <span className="chord">Am</span>
                <span className="lyrics">Amazing </span>
              </span>
              <span className="column">
                <span className="chord">G</span>
                <span className="lyrics">grace, how </span>
              </span>
              <span className="column">
                <span className="chord">C</span>
                <span className="lyrics">sweet the</span>
              </span>
            </div>

            {/* Line 2 */}
            <div className="row">
              <span className="column">
                <span className="chord">F</span>
                <span className="lyrics">sound, that </span>
              </span>
              <span className="column">
                <span className="chord">C/E</span>
                <span className="lyrics">saved a </span>
              </span>
              <span className="column">
                <span className="chord">G</span>
                <span className="lyrics">wretch like me</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
