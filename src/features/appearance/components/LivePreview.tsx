/**
 * Live Preview
 *
 * Shows a sample chord/lyric snippet with current appearance settings applied.
 */

interface LivePreviewProps {
  className?: string;
}

export function LivePreview({ className }: LivePreviewProps) {
  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium text-muted-foreground">Preview</p>
      <div className="rounded-lg border bg-card p-4 pt-8">
        <div className="chord-preview space-y-4 font-[var(--font-app)]">
          {/* Line 1 */}
          <div className="relative">
            <div className="flex flex-wrap gap-x-1">
              <span className="relative inline-block">
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-chord)",
                    color: "hsl(var(--chord-color))",
                    fontWeight: "var(--chord-weight)",
                    fontSize: "calc(0.75rem * var(--chord-size-scale))",
                    backgroundColor: "var(--chord-highlight-bg)",
                    padding: "var(--chord-highlight-padding)",
                    borderRadius: "var(--chord-highlight-radius)",
                  }}
                >
                  Am
                </span>
                <span>Amazing</span>
              </span>
              <span className="relative inline-block">
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-chord)",
                    color: "hsl(var(--chord-color))",
                    fontWeight: "var(--chord-weight)",
                    fontSize: "calc(0.75rem * var(--chord-size-scale))",
                    backgroundColor: "var(--chord-highlight-bg)",
                    padding: "var(--chord-highlight-padding)",
                    borderRadius: "var(--chord-highlight-radius)",
                  }}
                >
                  G
                </span>
                <span>grace, how</span>
              </span>
              <span className="relative inline-block">
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-chord)",
                    color: "hsl(var(--chord-color))",
                    fontWeight: "var(--chord-weight)",
                    fontSize: "calc(0.75rem * var(--chord-size-scale))",
                    backgroundColor: "var(--chord-highlight-bg)",
                    padding: "var(--chord-highlight-padding)",
                    borderRadius: "var(--chord-highlight-radius)",
                  }}
                >
                  C
                </span>
                <span>sweet the</span>
              </span>
            </div>
          </div>

          {/* Line 2 */}
          <div className="relative">
            <div className="flex flex-wrap gap-x-1">
              <span className="relative inline-block">
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-chord)",
                    color: "hsl(var(--chord-color))",
                    fontWeight: "var(--chord-weight)",
                    fontSize: "calc(0.75rem * var(--chord-size-scale))",
                    backgroundColor: "var(--chord-highlight-bg)",
                    padding: "var(--chord-highlight-padding)",
                    borderRadius: "var(--chord-highlight-radius)",
                  }}
                >
                  F
                </span>
                <span>sound, that</span>
              </span>
              <span className="relative inline-block">
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-chord)",
                    color: "hsl(var(--chord-color))",
                    fontWeight: "var(--chord-weight)",
                    fontSize: "calc(0.75rem * var(--chord-size-scale))",
                    backgroundColor: "var(--chord-highlight-bg)",
                    padding: "var(--chord-highlight-padding)",
                    borderRadius: "var(--chord-highlight-radius)",
                  }}
                >
                  C/E
                </span>
                <span>saved a</span>
              </span>
              <span className="relative inline-block">
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-chord)",
                    color: "hsl(var(--chord-color))",
                    fontWeight: "var(--chord-weight)",
                    fontSize: "calc(0.75rem * var(--chord-size-scale))",
                    backgroundColor: "var(--chord-highlight-bg)",
                    padding: "var(--chord-highlight-padding)",
                    borderRadius: "var(--chord-highlight-radius)",
                  }}
                >
                  G
                </span>
                <span>wretch like me</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
