/**
 * ChordProSplitView Component
 *
 * Provides a responsive split view showing ChordPro editor and preview.
 * Desktop: Toggle between editor-only and side-by-side split view.
 * Mobile: Toggle between full-width editor and full-width preview.
 */

import { useState, useRef, useEffect } from 'react';
import ChordProEditor from './ChordProEditor';
import ChordProViewer from './ChordProViewer';
import { Button } from '@/components/ui/button';
import { Eye, Edit3 } from 'lucide-react';
import config from '@/lib/config';

const { editor: editorConfig } = config.chordpro;

/**
 * Split view component for editing and previewing ChordPro content
 * @param {Object} props
 * @param {string} props.initialContent - Initial ChordPro content
 * @param {Function} props.onContentChange - Callback when content changes
 * @param {Object} props.editorOptions - Options for the editor
 * @param {Object} props.viewerOptions - Options for the viewer
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ChordProSplitView({
  initialContent = '',
  onContentChange,
  editorOptions = {},
  viewerOptions = {},
  className = ''
}) {
  const [content, setContent] = useState(initialContent);
  const [showPreview, setShowPreview] = useState(true); // Toggle between editor-only and split/preview
  const [splitRatio, setSplitRatio] = useState(50); // Percentage for left panel (desktop only)
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const splitBarRef = useRef(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < editorConfig.mobileBreakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle content changes
  const handleContentChange = (newContent) => {
    setContent(newContent);
    onContentChange?.(newContent);
  };

  // Handle split bar dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(20, Math.min(80, newRatio)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle touch events for mobile split dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e) => {
      if (!containerRef.current) return;

      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((touch.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(20, Math.min(80, newRatio)));
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Unified toggle control for both mobile and desktop
  const ToggleControl = () => (
    <div className="flex items-center justify-between p-2 bg-slate-100 border-b">
      <span className="text-sm font-medium text-muted-foreground">
        {isMobile ? (
          showPreview ? 'Viewing Preview' : 'Editing'
        ) : (
          'Edit Mode'
        )}
      </span>
      <Button
        variant={isMobile ? "default" : "ghost"}
        size="sm"
        onClick={() => {
          setShowPreview(!showPreview);
          // Reset to centered split when showing preview
          if (!showPreview) {
            setSplitRatio(50);
          }
        }}
        className="gap-2"
      >
        {isMobile ? (
          // Mobile: Show what will happen when clicked
          showPreview ? (
            <>
              <Edit3 className="h-4 w-4" />
              <span>Switch to Editor</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span>View Preview</span>
            </>
          )
        ) : (
          // Desktop: Show toggle state
          showPreview ? (
            <>
              <Edit3 className="h-4 w-4" />
              <span>Hide Preview</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span>Show Preview</span>
            </>
          )
        )}
      </Button>
    </div>
  );

  // Mobile layout (full-width toggle)
  if (isMobile) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <ToggleControl />

        <div className="flex-1 overflow-auto">
          {showPreview ? (
            <ChordProViewer
              content={content}
              {...viewerOptions}
            />
          ) : (
            <ChordProEditor
              value={content}
              onChange={handleContentChange}
              {...editorOptions}
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop layout (editor or split view)
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <ToggleControl />

      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden relative"
      >
        {/* Editor Panel - Always visible */}
        <div
          className={`overflow-auto ${showPreview ? 'border-r' : ''}`}
          style={{ width: showPreview ? `${splitRatio}%` : '100%' }}
        >
          <div className="w-full max-w-3xl mx-auto px-1">
            <ChordProEditor
              value={content}
              onChange={handleContentChange}
              {...editorOptions}
            />
          </div>
        </div>

        {/* Split Bar - Only when preview shown */}
        {showPreview && (
          <>
            <div
              ref={splitBarRef}
              className={`
                w-1 bg-slate-200 hover:bg-slate-300 cursor-col-resize
                flex items-center justify-center relative
                ${isDragging ? 'bg-slate-400' : ''}
              `}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div className="w-0.5 h-8 bg-slate-400 rounded-full" />
            </div>

            {/* Preview Panel */}
            <div
              className="overflow-auto flex-1"
              style={{ width: `${100 - splitRatio}%` }}
            >
              <div className="w-full max-w-3xl mx-auto px-1">
                <ChordProViewer
                  content={content}
                  {...viewerOptions}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
