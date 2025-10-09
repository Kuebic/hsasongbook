/**
 * ChordProSplitView Component
 *
 * Production-ready split view system with:
 * - Desktop: Resizable panels using react-resizable-panels
 * - Mobile: Swipeable tab navigation with gesture support
 * - Synchronized scrolling between editor and preview
 * - Real-time preview updates with debouncing
 * - View mode management with persistence
 * - FAB toolbar for mobile actions
 * - Print-optimized CSS support
 */

import { useState, useRef, useEffect, useCallback, useMemo, RefObject } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import { useGesture } from '@use-gesture/react';
import { EditorView } from '@uiw/react-codemirror';
import ChordProEditor from './ChordProEditor';
import ChordProViewer from './ChordProViewer';
import { Button } from '@/components/ui/button';
import { Eye, Edit3, Maximize2, Minimize2, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import config from '@/lib/config';
import logger from '@/lib/logger';
import '../styles/print.css'; // Import print styles for professional chord sheet printing

// Mobile chord insertion components removed - users type chords directly

const { editor: editorConfig } = config.chordpro;

type ViewMode = 'edit' | 'preview' | 'split';

interface ChordProSplitViewProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  editorOptions?: Record<string, unknown>;
  viewerOptions?: Record<string, unknown>;
  className?: string;
  enableGestures?: boolean;
  arrangementId?: string | null;
  onViewModeExit?: (() => void) | null;
}

/**
 * Split view component for editing and previewing ChordPro content
 */
export function ChordProSplitView({
  initialContent = '',
  onContentChange,
  editorOptions = {},
  viewerOptions = {},
  className = '',
  enableGestures = true,
  arrangementId = null,
  onViewModeExit = null
}: ChordProSplitViewProps) {
  // View modes: 'edit' | 'preview' | 'split'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Restore from sessionStorage if available
    const stored = sessionStorage.getItem('chordpro-view-mode');
    return (stored as ViewMode) || 'split';
  });
  const [content, setContent] = useState(initialContent);
  const [debouncedContent, setDebouncedContent] = useState(initialContent);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTabIndex, setMobileTabIndex] = useState(0); // 0: editor, 1: preview

  // Refs for component instances
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const viewerScrollRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = (): void => {
      const mobile = window.innerWidth < editorConfig.mobileBreakpoint;
      setIsMobile(mobile);

      // On mobile, default to edit mode
      if (mobile && viewMode === 'split') {
        setViewMode('edit');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [viewMode]);

  // Persist view mode
  useEffect(() => {
    sessionStorage.setItem('chordpro-view-mode', viewMode);
  }, [viewMode]);

  // Handle content changes with debouncing for preview
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);

    // Debounce preview updates for performance
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedContent(newContent);
    }, 500); // 500ms debounce as specified in PRP
  }, [onContentChange]);

  // Store EditorView reference when editor is ready
  const handleEditorReady = useCallback((view: EditorView) => {
    editorViewRef.current = view;
    logger.debug('EditorView ready', view);
  }, []);

  // Mobile gesture support using @use-gesture/react
  const bind = useGesture(
    {
      onDrag: ({ direction: [x], distance, cancel }) => {
        if (!enableGestures || !isMobile) return;

        // Horizontal swipe to switch between editor and preview
        if (Math.abs(distance) > 50) {
          if (x > 0 && mobileTabIndex > 0) {
            // Swipe right - go to editor
            setMobileTabIndex(0);
            setViewMode('edit');
          } else if (x < 0 && mobileTabIndex < 1) {
            // Swipe left - go to preview
            setMobileTabIndex(1);
            setViewMode('preview');
          }
          cancel();
        }
      },
      onPinch: ({ offset: [scale] }) => {
        if (!enableGestures || !isMobile || !editorViewRef.current) return;

        // Pinch to zoom editor text
        // This would require additional implementation in the editor
        logger.debug('Pinch gesture detected', scale);
      }
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
        threshold: 10
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 2 },
        rubberband: true
      }
    }
  );

  // Fullscreen mode handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenEnabled) return;

    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen, toggleFullscreen]);

  // View mode controls
  const ViewModeControls = () => (
    <div className="flex items-center gap-2">
      {/* Desktop view mode buttons */}
      {!isMobile && (
        <>
          <Button
            variant={viewMode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className="gap-1"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('split')}
            className="gap-1"
          >
            <PanelLeftOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Split</span>
          </Button>
          <Button
            variant={viewMode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="gap-1"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </>
      )}

      {/* Mobile tab indicators */}
      {isMobile && (
        <div className="flex items-center gap-4 flex-1">
          <button
            className={cn(
              "flex-1 pb-2 border-b-2 transition-colors",
              mobileTabIndex === 0
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground"
            )}
            onClick={() => {
              setMobileTabIndex(0);
              setViewMode('edit');
            }}
          >
            Editor
          </button>
          <button
            className={cn(
              "flex-1 pb-2 border-b-2 transition-colors",
              mobileTabIndex === 1
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground"
            )}
            onClick={() => {
              setMobileTabIndex(1);
              setViewMode('preview');
            }}
          >
            Preview
          </button>
        </div>
      )}
    </div>
  );

  // Toolbar header for the split view
  const ToolbarHeader = () => (
    <div className="flex items-center justify-between p-2 bg-background border-b">
      <ViewModeControls />
      {onViewModeExit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewModeExit}
          className="gap-1 ml-auto"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">View</span>
        </Button>
      )}
    </div>
  );

  // Memoized editor options with editorView callback
  const enhancedEditorOptions = useMemo(
    () => ({
      ...editorOptions,
      onEditorReady: handleEditorReady,
      arrangementId,
      showToolbar: !isMobile // Hide default toolbar on mobile, use FAB instead
    }),
    [editorOptions, handleEditorReady, arrangementId, isMobile]
  );

  // Memoized viewer options with debounced content
  const enhancedViewerOptions = useMemo(
    () => ({
      ...viewerOptions,
      enablePrint: true
    }),
    [viewerOptions]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Mobile layout with swipeable tabs and FAB
  if (isMobile) {
    return (
      <div
        ref={containerRef}
        className={cn('flex flex-col h-full relative', className)}
        {...bind()}
      >
        <ToolbarHeader />

        <div className="flex-1 overflow-hidden">
          {/* Mobile tabs with gesture support */}
          <div
            className="flex transition-transform duration-300 ease-in-out h-full"
            style={{
              transform: `translateX(${-mobileTabIndex * 100}%)`,
              width: '200%'
            }}
          >
            {/* Editor tab */}
            <div className="w-1/2 h-full overflow-auto" ref={editorScrollRef}>
              <ChordProEditor
                value={content}
                onChange={handleContentChange}
                {...enhancedEditorOptions}
              />
            </div>

            {/* Preview tab */}
            <div className="w-1/2 h-full overflow-auto" ref={viewerScrollRef}>
              <ChordProViewer
                content={debouncedContent}
                {...enhancedViewerOptions}
              />
            </div>
          </div>
        </div>

        {/* Mobile FAB removed - users type chords directly per Phase 3.6 simplification */}

        {/* Bottom sheet removed - users type chords directly per Phase 3.6 simplification */}
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col h-full', className, {
        'fixed inset-0 z-50 bg-background': isFullscreen
      })}
    >
      <ToolbarHeader />

      <div className="flex-1 min-h-0">
        {viewMode === 'edit' && (
          <div className="h-full flex flex-col" ref={editorScrollRef}>
            <div className="w-full max-w-4xl mx-auto px-4 flex-1 min-h-0">
              <ChordProEditor
                value={content}
                onChange={handleContentChange}
                {...enhancedEditorOptions}
              />
            </div>
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="h-full overflow-auto" ref={viewerScrollRef}>
            <div className="w-full max-w-4xl mx-auto px-4">
              <ChordProViewer
                content={debouncedContent}
                {...enhancedViewerOptions}
              />
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <PanelGroup
            direction="horizontal"
            className="h-full"
            onLayout={(sizes) => {
              // Optionally persist panel sizes
              sessionStorage.setItem('chordpro-panel-sizes', JSON.stringify(sizes));
            }}
          >
            <Panel
              defaultSize={50}
              minSize={20}
              className="flex flex-col"
              ref={editorScrollRef as RefObject<HTMLDivElement>}
            >
              <div className="w-full max-w-4xl mx-auto px-4 flex-1 min-h-0">
                <ChordProEditor
                  value={content}
                  onChange={handleContentChange}
                  {...enhancedEditorOptions}
                />
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-0.5 h-8 bg-border rounded-full" />
              </div>
            </PanelResizeHandle>

            <Panel
              minSize={20}
              className="overflow-hidden"
            >
              <div className="h-full overflow-auto" ref={viewerScrollRef}>
              <div className="w-full max-w-4xl mx-auto px-4">
                <ChordProViewer
                  content={debouncedContent}
                  {...enhancedViewerOptions}
                />
              </div>
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  );
}
