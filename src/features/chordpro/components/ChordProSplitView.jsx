/**
 * ChordProSplitView Component
 *
 * Provides a responsive split view showing ChordPro editor and preview.
 * Automatically adapts between horizontal (desktop) and vertical (mobile) layouts.
 */

import { useState, useRef, useEffect } from 'react';
import ChordProEditor from './ChordProEditor';
import ChordProViewer from './ChordProViewer';
import { Button } from '@/components/ui/button';
import {
  PanelLeftOpen,
  PanelRightOpen,
  SplitSquareHorizontal,
  Eye,
  Edit3
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('split'); // 'split', 'editor', 'preview'
  const [splitRatio, setSplitRatio] = useState(50); // Percentage for left panel
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

  // View mode controls for mobile
  const ViewModeControls = () => (
    <div className="flex gap-1 p-2 bg-slate-100 border-b">
      <Button
        variant={viewMode === 'editor' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('editor')}
        className="flex-1"
      >
        <Edit3 className="h-4 w-4 mr-1" />
        Edit
      </Button>

      <Button
        variant={viewMode === 'split' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('split')}
        className="flex-1"
      >
        <SplitSquareHorizontal className="h-4 w-4 mr-1" />
        Split
      </Button>

      <Button
        variant={viewMode === 'preview' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('preview')}
        className="flex-1"
      >
        <Eye className="h-4 w-4 mr-1" />
        Preview
      </Button>
    </div>
  );

  // Split view controls for desktop
  const SplitControls = () => (
    <div className="flex gap-1 p-2 bg-slate-50 border-b">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSplitRatio(25)}
        title="Favor preview"
      >
        <PanelRightOpen className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSplitRatio(50)}
        title="Equal split"
      >
        <SplitSquareHorizontal className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSplitRatio(75)}
        title="Favor editor"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </Button>
    </div>
  );

  // Mobile layout (stacked)
  if (isMobile) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <ViewModeControls />

        <div className="flex-1 overflow-auto">
          {viewMode === 'editor' && (
            <ChordProEditor
              value={content}
              onChange={handleContentChange}
              {...editorOptions}
            />
          )}

          {viewMode === 'preview' && (
            <div className="h-full overflow-auto">
              <ChordProViewer
                content={content}
                {...viewerOptions}
              />
            </div>
          )}

          {viewMode === 'split' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 border-b overflow-auto">
                <ChordProEditor
                  value={content}
                  onChange={handleContentChange}
                  {...editorOptions}
                />
              </div>
              <div className="flex-1 overflow-auto">
                <ChordProViewer
                  content={content}
                  {...viewerOptions}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout (side by side)
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <SplitControls />

      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden relative"
      >
        {/* Editor Panel */}
        <div
          className="overflow-auto border-r"
          style={{ width: `${splitRatio}%` }}
        >
          <div className="w-full max-w-3xl mx-auto px-1">
            <ChordProEditor
            value={content}
            onChange={handleContentChange}
            {...editorOptions}
            />
          </div>
        </div>

        {/* Split Bar */}
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
      </div>
    </div>
  );
}
