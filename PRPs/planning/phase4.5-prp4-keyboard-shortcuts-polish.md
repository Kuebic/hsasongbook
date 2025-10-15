# PRP 4: Keyboard Shortcuts Help System + Phase 4.5 Polish

**Phase**: 4.5 (UX Polish & Feature Completion)
**Priority**: P1 (Essential for Phase 4.5 completion)
**Estimated Effort**: 6-8 hours
**Confidence Score**: 9/10 (Excellent foundation, well-understood patterns)

---

## Goal

Create a comprehensive keyboard shortcuts help system with centralized registry, platform-aware display, and discoverability features. Complete Phase 4.5 with cross-browser testing, mobile polish, and final documentation updates to ensure production-ready quality before Phase 5 (Cloud Sync).

**What Success Looks Like**:
- Users can press `?` key to view all available keyboard shortcuts in a modal
- Platform detection shows correct modifier keys (⌘ on Mac, Ctrl on Windows/Linux)
- All shortcuts from all features aggregated in one place
- Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- Mobile experience polished and responsive
- Zero console errors, zero accessibility violations
- CLAUDE.md updated with Phase 4.5 completion status

---

## User Persona

**Primary**: Alex (Worship Leader with Power User Habits)
- Expects keyboard shortcuts for efficiency
- Wants to discover shortcuts without leaving the app
- Uses keyboard-first workflow when possible
- Appreciates platform-native conventions (⌘ on Mac)

**Secondary**: Sarah (Occasional Musician)
- May accidentally press `?` and discover shortcuts
- Benefits from visual reminder of available shortcuts
- Primarily uses mouse/touch but occasionally tries shortcuts

---

## Why This Matters

### Problem
Current keyboard shortcuts exist but are **hidden** and **undiscoverable**:
- Global shortcuts in `useKeyboardShortcuts.ts`: `/`, `Escape`, `Ctrl/Cmd+H`
- Editor shortcuts in `useEditorShortcuts.ts`: 5 editor-specific shortcuts
- Performance shortcuts in `useArrowKeyNavigation.ts`: Arrow keys, `n/p`, `Home/End`
- List navigation in `useKeyboardNavigation.ts`: Arrow keys, `Enter`, `Escape`

Users cannot discover these without reading the code or stumbling upon them accidentally.

### Success Metrics
- Users can discover all shortcuts via `?` key within 5 seconds
- Platform detection accuracy: 100% (Mac vs Windows/Linux)
- Cross-browser compatibility: All 4 major browsers pass
- Mobile responsiveness: No layout breaks on any viewport size
- Zero critical accessibility issues (WCAG 2.1 Level AA)

### Long-term Value
- **Phase 5 Readiness**: Clean, tested codebase ready for cloud sync integration
- **User Retention**: Power users stay engaged with efficient workflows
- **Reduced Support**: Self-service help reduces support questions
- **Professional Polish**: Production-ready quality builds user trust

---

## What We're Building

### Core Features

1. **Keyboard Shortcuts Help Modal** (`KeyboardShortcutsModal.tsx`)
   - Opens with `?` key press
   - Closes with `Escape` or modal dismiss
   - Groups shortcuts by category (Global, Editor, Navigation)
   - Platform-aware display (⌘ vs Ctrl)
   - Responsive design (mobile scrollable)

2. **Centralized Shortcuts Registry** (`keyboardShortcuts.ts`)
   - Single source of truth for all shortcuts
   - Type-safe interfaces
   - Easy to extend for future features
   - Platform detection utilities

3. **Cross-Browser Testing Checklist**
   - Chrome/Edge (Blink engine)
   - Firefox (Gecko engine)
   - Safari (WebKit engine)
   - Mobile browsers (iOS Safari, Chrome Android)

4. **Final Polish Pass**
   - Mobile responsive fixes
   - Console error cleanup
   - Performance optimization
   - Accessibility audit and fixes

5. **Documentation Updates**
   - CLAUDE.md Phase 4.5 completion
   - Keyboard shortcuts user guide
   - Testing procedures documented

---

## Context: How It Fits

### Existing Infrastructure

**Keyboard Shortcuts (Already Implemented)**:
```typescript
// src/features/shared/hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(): void {
  // Global shortcuts:
  // '/' - Focus search and navigate to home
  // 'Escape' - Go back
  // 'Ctrl/Cmd+H' - Go home
}

// src/features/chordpro/hooks/useEditorShortcuts.ts
export function useEditorShortcuts(editorView, options): UseEditorShortcutsReturn {
  // Editor shortcuts:
  // Ctrl/Cmd+S - Save
  // Ctrl/Cmd+P - Toggle preview
  // Ctrl/Cmd+F - Find
  // Ctrl/Cmd+[ - Insert chord brackets
  // Ctrl/Cmd+{ - Insert directive braces

  // Already has getShortcutList() method!
  const getShortcutList = (): ShortcutItem[] => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? '⌘' : 'Ctrl';
    return [
      { key: `${modKey}+S`, description: 'Save chord chart' },
      { key: `${modKey}+P`, description: 'Toggle preview' },
      // ... etc
    ];
  };
}

// src/features/setlists/hooks/useArrowKeyNavigation.ts
export function useArrowKeyNavigation(): void {
  // Performance mode shortcuts:
  // ArrowRight, Space, n/N - Next song
  // ArrowLeft, p/P, Backspace - Previous song
  // Home - First song
  // End - Last song
  // Escape - Exit fullscreen
}

// src/features/shared/hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation({ itemCount, onSelect }): UseKeyboardNavigationReturn {
  // List navigation shortcuts:
  // ArrowUp/Down - Navigate items
  // Enter - Select item
  // Home/End - First/last item
  // Escape - Clear selection
}
```

**shadcn/ui Dialog** (Already Installed):
```typescript
// src/components/ui/dialog.jsx (already exists)
import * as DialogPrimitive from '@radix-ui/react-dialog';
// Can be used for help modal
```

**Platform Detection Pattern**:
```typescript
// Already used in useEditorShortcuts.ts:
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? '⌘' : 'Ctrl';
```

### Architecture Fit

```
src/
├── features/
│   └── shared/
│       ├── components/
│       │   └── KeyboardShortcutsModal.tsx  [NEW - Help modal]
│       ├── hooks/
│       │   ├── useKeyboardShortcuts.ts     [MODIFY - Add '?' trigger]
│       │   ├── useEditorShortcuts.ts       [EXISTING - Has getShortcutList()]
│       │   ├── useArrowKeyNavigation.ts    [EXISTING - Performance mode]
│       │   └── useKeyboardNavigation.ts    [EXISTING - List navigation]
│       └── utils/
│           └── keyboardShortcuts.ts        [NEW - Centralized registry]
└── lib/
    └── utils/
        └── platform.ts                     [NEW - Platform detection utilities]
```

### Dependencies

**Already Installed**:
- `@radix-ui/react-dialog` - Modal component (via shadcn/ui)
- `lucide-react` - Icons (Keyboard, Command icons)
- `clsx` - Conditional classes
- `tailwind-merge` - Class merging

**No New Dependencies Required** ✅

---

## Implementation Blueprint

### Phase 1: Centralized Shortcuts Registry (1.5 hours)

#### 1.1 Create Platform Detection Utilities

**File**: `src/lib/utils/platform.ts`

```typescript
/**
 * Platform Detection Utilities
 *
 * Provides type-safe platform detection and modifier key display
 * for cross-platform keyboard shortcut documentation.
 */

export type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

/**
 * Detect the current platform based on user agent and navigator
 */
export function detectPlatform(): Platform {
  // SSR safety
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const platform = navigator.platform.toUpperCase();
  const userAgent = navigator.userAgent.toUpperCase();

  // Mac detection (includes iPad running iPadOS 13+)
  if (platform.includes('MAC') || userAgent.includes('MAC')) {
    return 'mac';
  }

  // Windows detection
  if (platform.includes('WIN') || userAgent.includes('WIN')) {
    return 'windows';
  }

  // Linux detection
  if (platform.includes('LINUX') || userAgent.includes('LINUX')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Check if the current platform is Mac
 */
export function isMac(): boolean {
  return detectPlatform() === 'mac';
}

/**
 * Check if the current platform is Windows
 */
export function isWindows(): boolean {
  return detectPlatform() === 'windows';
}

/**
 * Get the modifier key symbol for the current platform
 * @returns '⌘' on Mac, 'Ctrl' on Windows/Linux
 */
export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Get the alt key symbol for the current platform
 * @returns '⌥' on Mac, 'Alt' on Windows/Linux
 */
export function getAltKey(): string {
  return isMac() ? '⌥' : 'Alt';
}

/**
 * Get the shift key symbol for the current platform
 * @returns '⇧' on Mac, 'Shift' on Windows/Linux
 */
export function getShiftKey(): string {
  return isMac() ? '⇧' : 'Shift';
}

/**
 * Format a keyboard shortcut for display on the current platform
 * @param keys Array of key names (e.g., ['Mod', 'S'] for Cmd/Ctrl+S)
 * @returns Formatted string (e.g., '⌘S' on Mac, 'Ctrl+S' on Windows)
 *
 * @example
 * formatShortcut(['Mod', 'S']) // '⌘S' on Mac, 'Ctrl+S' on Windows
 * formatShortcut(['Mod', 'Shift', 'P']) // '⌘⇧P' on Mac, 'Ctrl+Shift+P' on Windows
 */
export function formatShortcut(keys: string[]): string {
  const formatted = keys.map(key => {
    switch (key.toLowerCase()) {
      case 'mod':
      case 'ctrl':
      case 'cmd':
      case 'command':
        return getModifierKey();
      case 'alt':
      case 'option':
        return getAltKey();
      case 'shift':
        return getShiftKey();
      default:
        return key;
    }
  });

  // Mac: No separator (⌘S)
  // Windows/Linux: Plus separator (Ctrl+S)
  return isMac() ? formatted.join('') : formatted.join('+');
}

/**
 * Check if a keyboard event matches a shortcut definition
 * Handles cross-platform modifier key differences
 *
 * @example
 * if (matchesShortcut(event, { key: 'S', modKey: true })) {
 *   handleSave();
 * }
 */
export interface ShortcutMatch {
  key: string;
  modKey?: boolean;  // Ctrl on Windows/Linux, Cmd on Mac
  altKey?: boolean;
  shiftKey?: boolean;
}

export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutMatch): boolean {
  const modKeyPressed = isMac() ? event.metaKey : event.ctrlKey;

  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    (shortcut.modKey ? modKeyPressed : true) &&
    (shortcut.altKey ? event.altKey : !event.altKey) &&
    (shortcut.shiftKey ? event.shiftKey : !event.shiftKey)
  );
}
```

**Why This Approach**:
- Centralizes platform detection logic (DRY principle)
- Type-safe with TypeScript
- Reusable across all features
- Handles edge cases (SSR, iPad, unknown platforms)
- Symbol-based Mac shortcuts match native OS convention

#### 1.2 Create Centralized Shortcuts Registry

**File**: `src/features/shared/utils/keyboardShortcuts.ts`

```typescript
/**
 * Keyboard Shortcuts Registry
 *
 * Centralized source of truth for all keyboard shortcuts in the app.
 * Used by KeyboardShortcutsModal to display help documentation.
 */

import { formatShortcut } from '@/lib/utils/platform';

export interface ShortcutItem {
  keys: string[];          // e.g., ['Mod', 'S']
  description: string;     // Human-readable description
  context?: string;        // Where the shortcut is active (e.g., 'Editor only')
}

export interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

/**
 * Get all keyboard shortcuts grouped by category
 * Returns platform-aware formatted shortcuts
 */
export function getAllShortcuts(): ShortcutCategory[] {
  return [
    {
      title: 'Global Navigation',
      shortcuts: [
        {
          keys: ['/'],
          description: 'Focus search and go to home page',
        },
        {
          keys: ['Mod', 'H'],
          description: 'Go to home page',
        },
        {
          keys: ['Escape'],
          description: 'Go back to previous page',
        },
        {
          keys: ['?'],
          description: 'Show keyboard shortcuts (this dialog)',
        },
      ],
    },
    {
      title: 'ChordPro Editor',
      shortcuts: [
        {
          keys: ['Mod', 'S'],
          description: 'Save chord chart',
          context: 'Editor only',
        },
        {
          keys: ['Mod', 'P'],
          description: 'Toggle preview mode',
          context: 'Editor only',
        },
        {
          keys: ['Mod', 'F'],
          description: 'Find in text',
          context: 'Editor only',
        },
        {
          keys: ['Mod', '['],
          description: 'Insert chord brackets [C]',
          context: 'Editor only',
        },
        {
          keys: ['Mod', '{'],
          description: 'Insert directive braces {title: }',
          context: 'Editor only',
        },
      ],
    },
    {
      title: 'Performance Mode',
      shortcuts: [
        {
          keys: ['ArrowRight'],
          description: 'Next song in setlist',
          context: 'Performance mode only',
        },
        {
          keys: ['ArrowLeft'],
          description: 'Previous song in setlist',
          context: 'Performance mode only',
        },
        {
          keys: ['Space'],
          description: 'Next song in setlist',
          context: 'Performance mode only',
        },
        {
          keys: ['N'],
          description: 'Next song in setlist',
          context: 'Performance mode only',
        },
        {
          keys: ['P'],
          description: 'Previous song in setlist',
          context: 'Performance mode only',
        },
        {
          keys: ['Home'],
          description: 'Jump to first song',
          context: 'Performance mode only',
        },
        {
          keys: ['End'],
          description: 'Jump to last song',
          context: 'Performance mode only',
        },
        {
          keys: ['Escape'],
          description: 'Exit fullscreen mode',
          context: 'Performance mode only',
        },
      ],
    },
    {
      title: 'List Navigation',
      shortcuts: [
        {
          keys: ['ArrowUp'],
          description: 'Navigate up in lists',
          context: 'When focused on lists',
        },
        {
          keys: ['ArrowDown'],
          description: 'Navigate down in lists',
          context: 'When focused on lists',
        },
        {
          keys: ['Enter'],
          description: 'Select highlighted item',
          context: 'When focused on lists',
        },
        {
          keys: ['Home'],
          description: 'Jump to first item',
          context: 'When focused on lists',
        },
        {
          keys: ['End'],
          description: 'Jump to last item',
          context: 'When focused on lists',
        },
        {
          keys: ['Escape'],
          description: 'Clear selection',
          context: 'When focused on lists',
        },
      ],
    },
  ];
}

/**
 * Get formatted shortcut string for display
 * @param keys Array of key names (e.g., ['Mod', 'S'])
 * @returns Formatted string for current platform
 */
export function getFormattedShortcut(keys: string[]): string {
  return formatShortcut(keys);
}

/**
 * Count total number of shortcuts
 */
export function getTotalShortcutCount(): number {
  return getAllShortcuts().reduce((total, category) => {
    return total + category.shortcuts.length;
  }, 0);
}
```

**Why This Approach**:
- Single source of truth for all shortcuts
- Easy to extend when adding new features
- Category grouping improves help modal organization
- Context field clarifies where shortcuts work
- Type-safe interfaces prevent errors

---

### Phase 2: Help Modal Component (2 hours)

#### 2.1 Create KeyboardShortcutsModal Component

**File**: `src/features/shared/components/KeyboardShortcutsModal.tsx`

```typescript
/**
 * KeyboardShortcutsModal Component
 *
 * Displays all available keyboard shortcuts grouped by category.
 * Opens with '?' key, closes with Escape or modal dismiss.
 * Responsive design with mobile scroll support.
 */

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { getAllShortcuts, getFormattedShortcut, type ShortcutCategory } from '../utils/keyboardShortcuts';
import { cn } from '@/lib/utils';

export interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const shortcuts = getAllShortcuts();

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and interact with the app more efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((category) => (
            <ShortcutCategorySection key={category.title} category={category} />
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ShortcutCategorySection Component
 * Displays a single category of shortcuts
 */
function ShortcutCategorySection({ category }: { category: ShortcutCategory }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-foreground">
        {category.title}
      </h3>
      <div className="space-y-2">
        {category.shortcuts.map((shortcut, index) => (
          <ShortcutRow key={`${category.title}-${index}`} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

/**
 * ShortcutRow Component
 * Displays a single shortcut with keys and description
 */
interface ShortcutRowProps {
  shortcut: {
    keys: string[];
    description: string;
    context?: string;
  };
}

function ShortcutRow({ shortcut }: ShortcutRowProps) {
  const formattedKeys = getFormattedShortcut(shortcut.keys);

  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-b-0">
      <div className="flex-1">
        <p className="text-sm text-foreground">
          {shortcut.description}
        </p>
        {shortcut.context && (
          <p className="text-xs text-muted-foreground mt-1">
            {shortcut.context}
          </p>
        )}
      </div>
      <kbd
        className={cn(
          'px-2 py-1 text-xs font-semibold',
          'bg-muted text-muted-foreground',
          'border border-border rounded',
          'whitespace-nowrap',
          'shadow-sm'
        )}
      >
        {formattedKeys}
      </kbd>
    </div>
  );
}

export default KeyboardShortcutsModal;
```

**Styling Considerations**:
- `max-h-[80vh]` - Prevents modal from exceeding viewport
- `overflow-y-auto` - Scrollable content on mobile
- `<kbd>` element - Semantic HTML for keyboard keys
- Border-bottom on rows - Visual separation
- Responsive flex layout - Adapts to mobile/desktop

**Accessibility**:
- Dialog has proper ARIA attributes (via Radix UI)
- Keyboard focus trapped in modal (Radix UI behavior)
- Escape key closes modal (both via hook and Radix)
- Semantic HTML (`<kbd>` for keys)

---

### Phase 3: Integrate Help Modal Trigger (1 hour)

#### 3.1 Add '?' Key Trigger to Global Shortcuts

**File**: `src/features/shared/hooks/useKeyboardShortcuts.ts`

**MODIFY** this file to add `?` key trigger:

```typescript
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export interface UseKeyboardShortcutsReturn {
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;
}

export function useKeyboardShortcuts(): UseKeyboardShortcutsReturn {
  const navigate = useNavigate()
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      // Don't trigger if typing in an input
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Keyboard shortcuts
      switch(event.key) {
        case '/':
          // Focus search on home page
          event.preventDefault()
          navigate('/')
          setTimeout(() => {
            const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]')
            if (searchInput) searchInput.focus()
          }, 100)
          break

        case 'Escape':
          // Go back (only if modal is not open)
          if (!showShortcutsModal) {
            navigate(-1)
          }
          break

        case 'h':
          // Go home
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            navigate('/')
          }
          break

        case '?':
          // Show keyboard shortcuts modal
          event.preventDefault()
          setShowShortcutsModal(true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigate, showShortcutsModal])

  return {
    showShortcutsModal,
    setShowShortcutsModal
  }
}
```

**Key Changes**:
1. Hook now returns state for modal visibility
2. Added `?` key case to open modal
3. Modified `Escape` to respect modal state
4. Type-safe return interface

#### 3.2 Integrate Modal in App.tsx

**File**: `src/app/App.tsx`

**MODIFY** the `AppWithFeatures` component:

```typescript
// Add import at top
import KeyboardShortcutsModal from '../features/shared/components/KeyboardShortcutsModal'

function AppWithFeatures() {
  // MODIFY: useKeyboardShortcuts now returns modal state
  const { showShortcutsModal, setShowShortcutsModal } = useKeyboardShortcuts()

  // Initialize PWA features (existing code)
  const { needRefresh, updateServiceWorker } = usePWA()

  // ... existing useEffect for initializePWA ...

  return (
    <>
      <ScrollRestoration />
      <MobileNav />

      {/* PWA UI Components */}
      <OfflineIndicator />
      {needRefresh && (
        <UpdateNotification
          onUpdate={updateServiceWorker}
        />
      )}

      {/* NEW: Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        open={showShortcutsModal}
        onOpenChange={setShowShortcutsModal}
      />

      <Routes>
        {/* ... existing routes ... */}
      </Routes>
    </>
  )
}
```

**Why This Placement**:
- App-level component ensures modal is available everywhere
- Doesn't interfere with route-specific components
- Consistent with other global UI (OfflineIndicator, UpdateNotification)

---

### Phase 4: Cross-Browser Testing (1.5 hours)

#### 4.1 Browser Compatibility Matrix

**Browsers to Test**:

| Browser | Engine | Version | Priority | Test Focus |
|---------|--------|---------|----------|-----------|
| Chrome | Blink | Latest | P0 | Primary development browser |
| Edge | Blink | Latest | P0 | Windows users |
| Firefox | Gecko | Latest | P1 | Keyboard event differences |
| Safari | WebKit | Latest | P1 | Mac users, iOS Safari quirks |
| iOS Safari | WebKit | Latest | P1 | Mobile PWA install, touch |
| Chrome Android | Blink | Latest | P2 | Android PWA |

**Testing Checklist**:

```markdown
## Browser Testing Checklist

### Chrome (Latest)
- [ ] All keyboard shortcuts work (/, Escape, Ctrl+H, ?)
- [ ] Modal opens with ? key
- [ ] Modal closes with Escape
- [ ] Platform detection shows correct modifier (Ctrl on Windows, ⌘ on Mac)
- [ ] No console errors
- [ ] PWA installs successfully
- [ ] Service worker updates correctly

### Edge (Latest)
- [ ] All keyboard shortcuts work
- [ ] Modal display correct
- [ ] No console errors
- [ ] PWA install prompt appears

### Firefox (Latest)
- [ ] All keyboard shortcuts work (check Ctrl/Cmd differences)
- [ ] Modal animations smooth
- [ ] Dialog backdrop overlay correct
- [ ] No console errors

### Safari (macOS)
- [ ] All keyboard shortcuts work (⌘ modifier)
- [ ] Modal displays correctly
- [ ] No WebKit-specific bugs
- [ ] No console errors

### iOS Safari
- [ ] PWA adds to Home Screen
- [ ] Offline mode works after install
- [ ] Modal scrolls correctly on small screens
- [ ] Touch targets meet 44px minimum (WCAG)
- [ ] No layout breaks on iPhone SE (375px width)
- [ ] No layout breaks on iPhone 14 Pro Max (430px width)

### Chrome Android
- [ ] PWA install banner appears
- [ ] Offline mode works
- [ ] Modal scrolls correctly
- [ ] No layout issues
```

#### 4.2 Keyboard Event Testing

**File**: `scripts/test-keyboard-events.html` (Dev tool, not production code)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Keyboard Event Tester</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 1rem;
    }
    .event-log {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 14px;
    }
    .event-item {
      padding: 0.5rem;
      border-bottom: 1px solid #eee;
    }
    .event-item:last-child {
      border-bottom: none;
    }
    .key {
      background: #007bff;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Keyboard Event Tester</h1>
  <p>Press any key to see the event details. Use this to verify keyboard shortcuts work correctly across browsers.</p>

  <div>
    <strong>Platform:</strong> <span id="platform"></span><br>
    <strong>User Agent:</strong> <span id="userAgent"></span>
  </div>

  <h2>Event Log</h2>
  <button onclick="clearLog()">Clear Log</button>
  <div class="event-log" id="log"></div>

  <script>
    // Display platform info
    document.getElementById('platform').textContent = navigator.platform;
    document.getElementById('userAgent').textContent = navigator.userAgent;

    const log = document.getElementById('log');

    // Detect platform
    function detectPlatform() {
      const platform = navigator.platform.toUpperCase();
      if (platform.includes('MAC')) return 'Mac';
      if (platform.includes('WIN')) return 'Windows';
      if (platform.includes('LINUX')) return 'Linux';
      return 'Unknown';
    }

    const currentPlatform = detectPlatform();
    const modKey = currentPlatform === 'Mac' ? 'metaKey' : 'ctrlKey';

    // Listen for keyboard events
    document.addEventListener('keydown', (event) => {
      const item = document.createElement('div');
      item.className = 'event-item';

      const modifiers = [];
      if (event.ctrlKey) modifiers.push('Ctrl');
      if (event.metaKey) modifiers.push('Cmd');
      if (event.altKey) modifiers.push('Alt');
      if (event.shiftKey) modifiers.push('Shift');

      const modString = modifiers.length > 0 ? modifiers.join('+') + '+' : '';

      item.innerHTML = `
        <span class="key">${modString}${event.key}</span>
        <br>
        <small>
          key: "${event.key}" |
          code: "${event.code}" |
          keyCode: ${event.keyCode} |
          ctrlKey: ${event.ctrlKey} |
          metaKey: ${event.metaKey} |
          altKey: ${event.altKey} |
          shiftKey: ${event.shiftKey}
        </small>
      `;

      log.prepend(item);

      // Keep log at max 50 items
      while (log.children.length > 50) {
        log.removeChild(log.lastChild);
      }
    });

    function clearLog() {
      log.innerHTML = '';
    }
  </script>
</body>
</html>
```

**How to Use**:
1. Open `scripts/test-keyboard-events.html` in each browser
2. Press keyboard shortcuts (`Ctrl+S`, `Cmd+P`, `/`, `?`, etc.)
3. Verify `event.key`, `event.code`, and modifiers match expectations
4. Check for browser-specific quirks (e.g., Firefox `event.key` differences)

---

### Phase 5: Mobile Polish & Responsive Fixes (1.5 hours)

#### 5.1 Mobile Responsive Audit

**Test Viewports**:
- iPhone SE: 375x667 (smallest modern phone)
- iPhone 14: 390x844
- iPhone 14 Pro Max: 430x932 (largest iPhone)
- iPad Mini: 768x1024
- iPad Pro: 1024x1366

**Mobile Testing Checklist**:

```markdown
## Mobile Responsive Checklist

### Layout Issues
- [ ] No horizontal scrolling on any viewport (375px+)
- [ ] Modal fits within viewport height (max-h-[80vh])
- [ ] Modal content scrolls correctly on small screens
- [ ] Touch targets meet 44-48px minimum (WCAG 2.5.5)
- [ ] Text remains readable (16px minimum body text)

### MobileNav Issues
- [ ] Z-index correct (Z_INDEX.mobileNav from config)
- [ ] Back button works on all pages
- [ ] Home button navigates to /
- [ ] Setlists button navigates to /setlists
- [ ] All buttons have 48px touch targets
- [ ] Button spacing prevents accidental taps (8px minimum gap)

### Performance Mode Mobile
- [ ] Fullscreen works on iOS Safari (webkit-fullscreen-video)
- [ ] Arrow key navigation works with Bluetooth keyboards
- [ ] Swipe gestures don't conflict with arrow keys
- [ ] Progress bar visible and readable
- [ ] Exit fullscreen button accessible (44px minimum)

### Editor Mobile
- [ ] CodeMirror scrolls correctly on iOS
- [ ] Virtual keyboard doesn't cover editor toolbar
- [ ] Save button always accessible (fixed toolbar)
- [ ] Preview toggle visible on small screens
- [ ] Metadata form dropdowns work on iOS (native select fallback)

### Search Page Mobile
- [ ] Search input autofocuses on page load (mobile Safari quirk)
- [ ] Virtual keyboard doesn't hide results
- [ ] Recent songs widget scrolls horizontally on small screens
- [ ] Stats widget stacks vertically on mobile
- [ ] Featured arrangements grid responsive (1 column on mobile)

### General Mobile
- [ ] No console errors on iOS Safari
- [ ] No layout shift (CLS score < 0.1)
- [ ] Page load < 3s on 3G
- [ ] Offline mode works after PWA install
- [ ] Update notification visible but not intrusive
```

#### 5.2 Common Mobile Fixes

**Fix 1: Modal Height on Mobile**

If modal overflows viewport on small screens, adjust `DialogContent`:

```typescript
// src/features/shared/components/KeyboardShortcutsModal.tsx
<DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
  {/* Slightly taller on mobile to use available space */}
</DialogContent>
```

**Fix 2: Keyboard Shortcuts Not Working on iOS**

iOS Safari doesn't support hardware keyboard shortcuts by default (touch-first platform). Document this limitation:

```typescript
// Add to KeyboardShortcutsModal description
<DialogDescription>
  Use these shortcuts to navigate and interact with the app more efficiently.
  {isIOS() && (
    <span className="block text-xs text-muted-foreground mt-2">
      Note: Hardware keyboard required for shortcuts on iOS
    </span>
  )}
</DialogDescription>
```

**Fix 3: Touch Targets Too Small**

Ensure all interactive elements meet 44px minimum:

```typescript
// src/features/shared/components/MobileNav.tsx
<Button
  variant="ghost"
  size="default"  // Changed from "sm" to "default" (44px height)
  className="min-w-[44px] min-h-[44px]"  // Enforce WCAG 2.5.5
  onClick={goBack}
>
  <ArrowLeft className="h-5 w-5" />
  <span className="ml-2 text-sm">Back</span>
</Button>
```

**Fix 4: Horizontal Scroll on Small Screens**

If content overflows horizontally, add container constraints:

```css
/* src/App.css or index.css */
body {
  overflow-x: hidden; /* Prevent horizontal scroll */
}

.container {
  max-width: 100vw; /* Constrain to viewport width */
  overflow-x: hidden;
}
```

---

### Phase 6: Final Polish & Documentation (1.5 hours)

#### 6.1 Console Error Cleanup

**Run Full App Audit**:

```bash
# 1. Start dev server
npm run dev

# 2. Open browser console and navigate through all pages:
# - Home (/)
# - Song page (/song/:slug)
# - Arrangement page (/song/:slug/:arrangement)
# - Setlists index (/setlists)
# - Setlist detail (/setlist/:id)
# - Performance mode (/setlist/:id/performance)
# - Settings page (if implemented via PRP 2)

# 3. Check for errors:
# - No console.error() calls
# - No unhandled promise rejections
# - No React warnings (e.g., key prop missing)
# - No accessibility warnings

# 4. Run production build
npm run build
npm run preview

# 5. Verify no production errors
```

**Common Issues to Fix**:

1. **Missing key prop in lists**:
```typescript
// BAD
{items.map(item => <div>{item.name}</div>)}

// GOOD
{items.map(item => <div key={item.id}>{item.name}</div>)}
```

2. **Unhandled promise rejections**:
```typescript
// BAD
async function loadData() {
  const data = await fetch('/api/songs');
  // No error handling
}

// GOOD
async function loadData() {
  try {
    const data = await fetch('/api/songs');
    return data;
  } catch (error) {
    logger.error('Failed to load data:', error);
    return null; // Graceful fallback
  }
}
```

3. **React 19 deprecation warnings**:
```typescript
// React 19 prefers ref callback instead of forwardRef
// If you see warnings, refer to React 19 migration guide
```

#### 6.2 Accessibility Audit

**Run Automated Audit**:

```bash
# Option 1: Lighthouse in Chrome DevTools
# 1. Open DevTools
# 2. Go to Lighthouse tab
# 3. Select "Accessibility" category
# 4. Run audit
# 5. Fix any issues with score < 90

# Option 2: axe DevTools (Browser Extension)
# 1. Install axe DevTools extension
# 2. Run scan on each page
# 3. Fix critical and serious issues
```

**Manual Accessibility Checklist**:

```markdown
## WCAG 2.1 Level AA Compliance

### Perceivable
- [ ] All images have alt text
- [ ] Color contrast ratio ≥ 4.5:1 for text (use Chrome DevTools)
- [ ] No information conveyed by color alone
- [ ] Focus indicators visible on all interactive elements

### Operable
- [ ] All functionality available via keyboard
- [ ] No keyboard traps (can tab into and out of all components)
- [ ] Skip-to-content link present (PRP 1)
- [ ] Touch targets ≥ 44x44px (WCAG 2.5.5)
- [ ] No time limits on interactions (or user can extend)

### Understandable
- [ ] lang="en" on <html> tag
- [ ] Form labels clearly associated with inputs
- [ ] Error messages clear and specific
- [ ] Consistent navigation across pages

### Robust
- [ ] Valid HTML (no nested buttons, proper heading hierarchy)
- [ ] ARIA labels on icon buttons
- [ ] Modal has aria-modal="true" (Radix UI handles this)
- [ ] Live regions for dynamic content (aria-live)
```

**Fix Example - Icon Button Missing Label**:

```typescript
// BAD
<Button onClick={handleSave}>
  <Save className="h-5 w-5" />
</Button>

// GOOD
<Button onClick={handleSave} aria-label="Save chord chart">
  <Save className="h-5 w-5" />
</Button>
```

#### 6.3 Performance Optimization

**Bundle Size Analysis**:

```bash
# Build and analyze bundle size
npm run build

# Check dist/ folder sizes
du -sh dist/*

# Target: Total bundle < 2 MB (1.5 MB is current baseline)
```

**If Bundle Too Large**:

1. **Lazy load routes**:
```typescript
// src/app/App.tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy pages
const SetlistPerformancePage = lazy(() =>
  import('../features/setlists').then(m => ({ default: m.SetlistPerformancePage }))
);

// Wrap in Suspense
<Route
  path="/setlist/:setlistId/performance/:arrangementIndex?"
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <SetlistPerformancePage />
    </Suspense>
  }
/>
```

2. **Tree-shake unused libraries**:
```typescript
// BAD - imports entire library
import _ from 'lodash';

// GOOD - imports only used function
import debounce from 'lodash/debounce';
```

3. **Optimize ChordSheetJS** (if needed):
```typescript
// Check if chordsheetjs can be lazy-loaded
const ChordSheetJS = lazy(() => import('chordsheetjs'));
```

#### 6.4 Update CLAUDE.md

**File**: `CLAUDE.md`

**MODIFY** Phase 4.5 section to mark as complete:

```markdown
### ✅ Phase 4.5: UX Polish & Feature Completion (COMPLETED)
**Goal**: Polish user experience and complete MVP features before Phase 5 cloud sync

**Completed Features**:
1. ✅ Global Navigation System (PRP 1)
   - Desktop header with logo and navigation links
   - Enhanced mobile navigation with 3 buttons (Back, Home, Setlists)
   - Skip-to-content link for accessibility (WCAG 2.4.1)
   - Z-index management system to prevent stacking conflicts

2. ✅ Dark Mode + Theme System (PRP 2)
   - Theme provider with React Context (light/dark/system)
   - FOUC prevention with inline blocking script
   - Theme toggle component with dropdown UI
   - Settings page with Appearance, About, and Account sections
   - System preference detection and change listener

3. ✅ Enhanced Search/Homepage (PRP 3)
   - Recent songs widget (last 10 viewed)
   - Stats widget (total songs/arrangements/setlists)
   - Featured arrangements widget (algorithm-based ranking)
   - View tracking hook (updates lastAccessedAt field)
   - Profile placeholder page (ready for Phase 5 auth)

4. ✅ Keyboard Shortcuts Help System (PRP 4)
   - Centralized shortcuts registry (single source of truth)
   - Help modal (press `?` to open)
   - Platform-aware display (⌘ on Mac, Ctrl on Windows/Linux)
   - Grouped by category (Global, Editor, Performance, Lists)
   - 26 total shortcuts documented

5. ✅ Cross-Browser Testing (PRP 4)
   - Chrome, Edge, Firefox, Safari tested
   - iOS Safari PWA install verified
   - Chrome Android PWA tested
   - Zero critical issues found

6. ✅ Mobile Responsive Polish (PRP 4)
   - All touch targets ≥ 44px (WCAG 2.5.5)
   - No horizontal scroll on any viewport (375px+)
   - Modal scrolling works correctly on all devices
   - Keyboard shortcuts gracefully hidden on iOS

7. ✅ Accessibility Audit (WCAG 2.1 Level AA) (PRP 4)
   - Lighthouse accessibility score ≥ 90 on all pages
   - Skip-to-content link implemented
   - All interactive elements keyboard accessible
   - Color contrast ratios meet 4.5:1 minimum
   - ARIA labels on all icon buttons

8. ✅ Production Readiness (PRP 4)
   - Zero console errors in production build
   - Bundle size optimized (< 2 MB)
   - Service worker caching verified
   - Offline mode fully functional
   - Update notifications working correctly

**Success Criteria**: (ALL MET ✅)
- ✅ Users can discover all shortcuts via `?` key
- ✅ Platform detection 100% accurate
- ✅ All 4 major browsers pass testing
- ✅ Zero critical accessibility issues
- ✅ Mobile experience polished (no layout breaks)
- ✅ Production build has zero console errors
- ✅ Bundle size < 2 MB

**Testing Status**:
- ✅ Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- ✅ Mobile testing complete (iOS Safari, Chrome Android)
- ✅ Accessibility audit complete (WCAG 2.1 AA)
- ⚠️ Unit tests: 0% coverage (testing framework planned for Phase 5)

**PRPs**:
- PRP 1: Navigation System (`PRPs/phase4.5-prp1-navigation-system.md`)
- PRP 2: Dark Mode + Theme System (`PRPs/phase4.5-prp2-dark-mode-theme-system.md`)
- PRP 3: Enhanced Search/Homepage (`PRPs/phase4.5-prp3-enhanced-search-homepage.md`)
- PRP 4: Keyboard Shortcuts + Polish (`PRPs/phase4.5-prp4-keyboard-shortcuts-polish.md`)

**Deferred to Phase 5**:
- User authentication and profiles (requires Supabase)
- Cloud sync for user-created content
- Multi-device sync
- Collaborative features

**Next Phase**: Phase 5 (Cloud Integration with Supabase)
```

#### 6.5 Create User-Facing Keyboard Shortcuts Guide (Optional)

If you want to provide user-facing documentation:

**File**: `docs/keyboard-shortcuts.md` (Optional)

```markdown
# Keyboard Shortcuts Guide

HSA Songbook supports keyboard shortcuts for efficient navigation and editing.

## How to View Shortcuts

Press **`?`** at any time to view the full list of keyboard shortcuts in a modal.

## Global Shortcuts

| Shortcut | Description |
|----------|-------------|
| `/` | Focus search and go to home page |
| `Ctrl+H` (Windows/Linux) or `⌘H` (Mac) | Go to home page |
| `Escape` | Go back to previous page |
| `?` | Show keyboard shortcuts help |

## ChordPro Editor

| Shortcut | Description |
|----------|-------------|
| `Ctrl+S` (Windows/Linux) or `⌘S` (Mac) | Save chord chart |
| `Ctrl+P` (Windows/Linux) or `⌘P` (Mac) | Toggle preview mode |
| `Ctrl+F` (Windows/Linux) or `⌘F` (Mac) | Find in text |
| `Ctrl+[` (Windows/Linux) or `⌘[` (Mac) | Insert chord brackets `[C]` |
| `Ctrl+{` (Windows/Linux) or `⌘{` (Mac) | Insert directive braces `{title: }` |

## Performance Mode

| Shortcut | Description |
|----------|-------------|
| `→` or `Space` or `N` | Next song in setlist |
| `←` or `P` or `Backspace` | Previous song in setlist |
| `Home` | Jump to first song |
| `End` | Jump to last song |
| `Escape` | Exit fullscreen mode |

## List Navigation

| Shortcut | Description |
|----------|-------------|
| `↑` / `↓` | Navigate up/down in lists |
| `Enter` | Select highlighted item |
| `Home` / `End` | Jump to first/last item |
| `Escape` | Clear selection |

## Platform Notes

- **Mac users**: `⌘` (Command key) replaces `Ctrl` in all shortcuts
- **Windows/Linux users**: `Ctrl` is used for all modifier shortcuts
- **Mobile users**: Hardware keyboard required for shortcuts (iOS/Android virtual keyboards don't support shortcuts)

## Tips

- Keyboard shortcuts don't work while typing in text fields (to avoid conflicts)
- Some shortcuts are context-specific (e.g., editor shortcuts only work in ChordPro editor)
- The `?` key works anywhere in the app to view this help
```

---

## Validation Loop

### Syntax Validation (Level 1)

```bash
# TypeScript type checking
npm run typecheck

# Expected: 0 errors
# If errors, fix type issues before proceeding
```

**Common Issues**:
- Missing type definitions for new components
- Incorrect prop types
- Unused imports

**Fix Example**:
```typescript
// Error: Property 'onOpenChange' does not exist on type 'KeyboardShortcutsModalProps'
// Fix: Add to interface definition
export interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;  // ADD THIS
}
```

### Component Validation (Level 2)

```bash
# Lint check
npm run lint

# Expected: 0 errors, 0 warnings
# If errors, fix before proceeding
```

**Common Issues**:
- Missing key props in lists
- Unused variables
- Console.log statements (should use logger)

**Fix Example**:
```typescript
// Error: Each child in a list should have a unique "key" prop
// Fix: Add key prop
{shortcuts.map((shortcut, index) => (
  <ShortcutRow key={`${category.title}-${index}`} shortcut={shortcut} />
))}
```

### Integration Validation (Level 3)

```bash
# Build production bundle
npm run build

# Expected: Build succeeds with no errors
# Check bundle size: dist/assets/*.js should be < 2 MB total

# Preview production build
npm run preview

# Open http://localhost:4173 and test:
# 1. Press '?' key - modal opens
# 2. Modal shows correct shortcuts
# 3. Press Escape - modal closes
# 4. Platform detection correct (⌘ on Mac, Ctrl on Windows)
# 5. No console errors
```

**What to Check**:
- Modal opens/closes correctly
- All shortcuts displayed
- Platform-specific keys correct
- Responsive on mobile (test on 375px viewport)
- No console errors or warnings

### Creative/User Experience Validation (Level 4)

**Test Scenarios**:

1. **New User Discovery**:
   - Open app for first time
   - Press random keys
   - Eventually press `?` - help modal appears
   - User discovers all shortcuts

2. **Power User Workflow**:
   - Press `/` to search
   - Type song name
   - Press `Enter` to select
   - Press `Ctrl/Cmd+S` to save edits
   - Press `?` to remind self of other shortcuts

3. **Mobile User**:
   - Open on iPhone
   - Press `?` (if hardware keyboard)
   - Modal fits within viewport
   - Scrolling works correctly
   - Touch targets large enough (44px)

4. **Accessibility User**:
   - Navigate with keyboard only (no mouse)
   - Tab through all elements
   - All interactive elements reachable
   - Focus visible on all elements
   - Screen reader announces shortcuts correctly

**Success Criteria**:
- ✅ Shortcuts feel intuitive (no surprising behavior)
- ✅ Modal discoverable within 2 minutes of use
- ✅ Platform-specific keys match OS conventions
- ✅ Mobile experience doesn't feel broken
- ✅ No accessibility barriers

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Hardcoding Shortcuts in Multiple Places

**BAD**:
```typescript
// In useKeyboardShortcuts.ts
case '/': // Focus search

// In KeyboardShortcutsModal.tsx
<ShortcutRow keys={['/']} description="Focus search" />

// In docs/keyboard-shortcuts.md
| `/` | Focus search |
```

**GOOD**:
```typescript
// src/features/shared/utils/keyboardShortcuts.ts
// Single source of truth
export function getAllShortcuts(): ShortcutCategory[] {
  return [
    {
      title: 'Global Navigation',
      shortcuts: [
        { keys: ['/'], description: 'Focus search and go to home page' }
      ]
    }
  ];
}

// Components and docs reference this registry
```

**Why**: DRY principle - update once, reflected everywhere

---

### ❌ Anti-Pattern 2: Ignoring Platform Differences

**BAD**:
```typescript
// Showing "Ctrl+S" on Mac
<kbd>Ctrl+S</kbd>
```

**GOOD**:
```typescript
// Platform-aware display
const modKey = isMac() ? '⌘' : 'Ctrl';
<kbd>{modKey}+S</kbd>
```

**Why**: Mac users expect `⌘` symbol, Windows/Linux users expect "Ctrl"

---

### ❌ Anti-Pattern 3: Keyboard Shortcuts Work in Input Fields

**BAD**:
```typescript
// No input filtering
document.addEventListener('keydown', (event) => {
  if (event.key === '/') {
    navigateToSearch(); // Triggers even when typing in input
  }
});
```

**GOOD**:
```typescript
// Filter out input fields
const target = event.target as HTMLElement;
if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
  return; // Don't trigger shortcuts
}
```

**Why**: Users should be able to type `/` in text fields without triggering shortcuts

---

### ❌ Anti-Pattern 4: Modal Not Keyboard Accessible

**BAD**:
```typescript
// No focus trap, no Escape key handler
<div className="modal">
  <button onClick={close}>Close</button>
</div>
```

**GOOD**:
```typescript
// Use Radix UI Dialog (built-in focus trap and Escape handler)
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Focus trapped, Escape closes */}
  </DialogContent>
</Dialog>
```

**Why**: Accessibility (WCAG 2.1) requires keyboard-accessible modals

---

### ❌ Anti-Pattern 5: Not Testing Cross-Browser

**BAD**:
```typescript
// Only tested in Chrome
if (event.metaKey) { // Works on Mac Chrome, breaks on Firefox
  handleShortcut();
}
```

**GOOD**:
```typescript
// Test in all browsers, use platform detection
const modKeyPressed = isMac() ? event.metaKey : event.ctrlKey;
if (modKeyPressed) {
  handleShortcut();
}
```

**Why**: Firefox, Safari, and Edge may handle keyboard events differently

---

### ❌ Anti-Pattern 6: Overloading Shortcuts

**BAD**:
```typescript
// Too many shortcuts, hard to remember
case 'a': handleAction1();
case 'b': handleAction2();
case 'c': handleAction3();
// ... 20 more shortcuts
```

**GOOD**:
```typescript
// Focus on most common actions
case '/': focusSearch();      // High value
case 'Escape': goBack();      // High value
case '?': showHelp();         // Discoverable
// Only 5-10 global shortcuts
```

**Why**: Users can't remember 20+ shortcuts - focus on high-value ones

---

### ❌ Anti-Pattern 7: No Mobile Consideration

**BAD**:
```typescript
// Modal fixed height, overflows on small screens
<div className="h-[800px]">
  {/* Content */}
</div>
```

**GOOD**:
```typescript
// Responsive height, scrollable content
<DialogContent className="max-h-[80vh] overflow-y-auto">
  {/* Content */}
</DialogContent>
```

**Why**: Mobile users need scrollable content that fits viewport

---

## Success Metrics

### Quantitative Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Shortcuts discoverable | < 2 min | User testing: time to find help modal |
| Platform detection accuracy | 100% | Automated test on Mac/Windows/Linux |
| Cross-browser compatibility | 4/4 browsers pass | Manual testing checklist |
| Bundle size increase | < 50 KB | `du -sh dist/assets/*.js` |
| Lighthouse accessibility score | ≥ 90 | Chrome DevTools Lighthouse audit |
| Console errors | 0 | Browser console on all pages |

### Qualitative Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Shortcut intuitiveness | 4/5 rating | User feedback survey |
| Help modal clarity | 4/5 rating | User feedback survey |
| Mobile experience quality | No layout breaks | Manual testing on 3+ devices |
| Professional polish | "Production-ready" feel | Internal team review |

### Phase 4.5 Completion Criteria

**All PRPs Complete**:
- ✅ PRP 1: Navigation System
- ✅ PRP 2: Dark Mode + Theme System
- ✅ PRP 3: Enhanced Search/Homepage
- ✅ PRP 4: Keyboard Shortcuts + Polish

**All Validation Gates Pass**:
- ✅ `npm run typecheck` - 0 errors
- ✅ `npm run lint` - 0 errors, 0 warnings
- ✅ `npm run build` - succeeds
- ✅ `npm run preview` - no console errors

**Cross-Browser Testing Complete**:
- ✅ Chrome (Blink)
- ✅ Firefox (Gecko)
- ✅ Safari (WebKit)
- ✅ Edge (Blink)
- ✅ iOS Safari (PWA install tested)
- ✅ Chrome Android (PWA tested)

**Accessibility Audit Complete**:
- ✅ Lighthouse score ≥ 90 on all pages
- ✅ WCAG 2.1 Level AA compliance
- ✅ Keyboard navigation works everywhere
- ✅ Touch targets ≥ 44px

**Documentation Updated**:
- ✅ CLAUDE.md Phase 4.5 marked complete
- ✅ Keyboard shortcuts documented
- ✅ Testing procedures documented

**Ready for Phase 5**:
- ✅ Clean codebase (no TODOs, no console errors)
- ✅ Production-ready quality
- ✅ Zero critical bugs
- ✅ Mobile experience polished

---

## Phase 4.5 Completion Checklist

Use this checklist to verify Phase 4.5 is complete:

```markdown
## Phase 4.5 Final Checklist

### PRP 1: Navigation System
- [ ] DesktopHeader component implemented
- [ ] MobileNav enhanced with 3 buttons (Back, Home, Setlists)
- [ ] SkipLink component implemented (WCAG 2.4.1)
- [ ] Z-index config centralized in lib/config/zIndex.ts
- [ ] Z-index conflicts resolved (MobileNav, UpdateNotification)

### PRP 2: Dark Mode + Theme System
- [ ] ThemeProvider implemented with React Context
- [ ] FOUC prevention script in index.html
- [ ] ThemeToggle component implemented
- [ ] Settings page created (Appearance, About, Account sections)
- [ ] System preference detection working
- [ ] Theme persists to localStorage

### PRP 3: Enhanced Search/Homepage
- [ ] RecentSongsWidget implemented
- [ ] StatsWidget implemented
- [ ] FeaturedArrangementsWidget implemented
- [ ] useViewTracking hook implemented
- [ ] Repository methods added (getRecentlyViewed, getFeatured)
- [ ] Profile placeholder page created

### PRP 4: Keyboard Shortcuts + Polish
- [ ] Platform detection utilities (lib/utils/platform.ts)
- [ ] Centralized shortcuts registry (features/shared/utils/keyboardShortcuts.ts)
- [ ] KeyboardShortcutsModal component
- [ ] '?' key trigger in useKeyboardShortcuts.ts
- [ ] Modal integrated in App.tsx
- [ ] Cross-browser testing complete
- [ ] Mobile responsive fixes complete
- [ ] Accessibility audit complete (score ≥ 90)
- [ ] Console errors cleaned up (0 errors)
- [ ] CLAUDE.md updated

### Build & Validation
- [ ] npm run typecheck - passes (0 errors)
- [ ] npm run lint - passes (0 errors, 0 warnings)
- [ ] npm run build - succeeds
- [ ] npm run preview - no console errors
- [ ] Bundle size < 2 MB

### Cross-Browser Testing
- [ ] Chrome - all features work
- [ ] Edge - all features work
- [ ] Firefox - all features work
- [ ] Safari - all features work
- [ ] iOS Safari - PWA installs, offline works
- [ ] Chrome Android - PWA works

### Mobile Testing
- [ ] iPhone SE (375px) - no layout breaks
- [ ] iPhone 14 (390px) - no layout breaks
- [ ] iPhone 14 Pro Max (430px) - no layout breaks
- [ ] iPad (768px) - no layout breaks
- [ ] All touch targets ≥ 44px (WCAG 2.5.5)

### Accessibility (WCAG 2.1 AA)
- [ ] Lighthouse score ≥ 90 on all pages
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Skip-to-content link works
- [ ] Color contrast ratios ≥ 4.5:1
- [ ] ARIA labels on icon buttons
- [ ] No keyboard traps

### Documentation
- [ ] CLAUDE.md Phase 4.5 marked complete
- [ ] All PRPs saved in PRPs/ folder
- [ ] Testing procedures documented
- [ ] Known issues documented (if any)

### Production Readiness
- [ ] Zero console errors in production build
- [ ] Service worker caching works
- [ ] Offline mode functional
- [ ] Update notifications working
- [ ] No critical bugs
- [ ] Professional polish ("production-ready" feel)
```

---

## Next Steps After Phase 4.5

Once Phase 4.5 is complete:

1. **Code Review**:
   - Review all new code with team
   - Address any feedback
   - Merge to main branch

2. **User Testing** (Optional):
   - Test with real users (worship leaders, musicians)
   - Gather feedback on UX polish
   - Prioritize any critical issues

3. **Deploy to Production** (Optional):
   - If self-hosted, deploy updated PWA
   - Test offline functionality
   - Monitor for errors

4. **Begin Phase 5 Planning**:
   - Review Supabase documentation
   - Plan authentication flow
   - Design sync strategy
   - Create PRPs for Phase 5 features

5. **Celebrate** 🎉:
   - Phase 4.5 is a major milestone!
   - The app is now production-ready with polished UX
   - Ready for cloud integration in Phase 5

---

## Resources

### Documentation
- [Radix UI Dialog Docs](https://www.radix-ui.com/primitives/docs/components/dialog)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Keyboard Events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)

### Tools
- [Lighthouse (Chrome DevTools)](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools (Browser Extension)](https://www.deque.com/axe/devtools/)
- [BrowserStack (Cross-Browser Testing)](https://www.browserstack.com/)

### Testing
- Manual testing checklist (see Phase 4)
- Keyboard event tester (`scripts/test-keyboard-events.html`)
- Mobile viewport testing (Chrome DevTools Device Mode)

---

## Appendix A: Complete Keyboard Shortcuts List

**Generated from centralized registry (`getAllShortcuts()`):**

### Global Navigation
- **`/`** - Focus search and go to home page
- **`Ctrl/⌘+H`** - Go to home page
- **`Escape`** - Go back to previous page
- **`?`** - Show keyboard shortcuts (this dialog)

### ChordPro Editor (Editor only)
- **`Ctrl/⌘+S`** - Save chord chart
- **`Ctrl/⌘+P`** - Toggle preview mode
- **`Ctrl/⌘+F`** - Find in text
- **`Ctrl/⌘+[`** - Insert chord brackets [C]
- **`Ctrl/⌘+{`** - Insert directive braces {title: }

### Performance Mode (Performance mode only)
- **`→`** - Next song in setlist
- **`←`** - Previous song in setlist
- **`Space`** - Next song in setlist
- **`N`** - Next song in setlist
- **`P`** - Previous song in setlist
- **`Home`** - Jump to first song
- **`End`** - Jump to last song
- **`Escape`** - Exit fullscreen mode

### List Navigation (When focused on lists)
- **`↑`** - Navigate up in lists
- **`↓`** - Navigate down in lists
- **`Enter`** - Select highlighted item
- **`Home`** - Jump to first item
- **`End`** - Jump to last item
- **`Escape`** - Clear selection

**Total: 26 shortcuts**

---

## Appendix B: Code Organization

**Files Created/Modified in PRP 4**:

```
hsasongbook/
├── src/
│   ├── app/
│   │   └── App.tsx                                    [MODIFY]
│   ├── features/
│   │   └── shared/
│   │       ├── components/
│   │       │   └── KeyboardShortcutsModal.tsx         [NEW]
│   │       ├── hooks/
│   │       │   └── useKeyboardShortcuts.ts            [MODIFY]
│   │       └── utils/
│   │           └── keyboardShortcuts.ts               [NEW]
│   └── lib/
│       └── utils/
│           └── platform.ts                            [NEW]
├── scripts/
│   └── test-keyboard-events.html                      [NEW - Dev tool]
├── docs/
│   └── keyboard-shortcuts.md                          [NEW - Optional]
└── CLAUDE.md                                          [MODIFY]
```

**Line Count Estimate**:
- `platform.ts`: ~150 lines
- `keyboardShortcuts.ts`: ~150 lines
- `KeyboardShortcutsModal.tsx`: ~200 lines
- `useKeyboardShortcuts.ts` (modified): +30 lines
- `App.tsx` (modified): +10 lines
- `test-keyboard-events.html`: ~120 lines
- **Total**: ~660 lines of new/modified code

**Bundle Size Impact**:
- Platform detection: ~2 KB
- Shortcuts registry: ~3 KB
- Modal component: ~5 KB
- **Total**: ~10 KB increase (negligible)

---

## Summary

**PRP 4: Keyboard Shortcuts + Polish** completes Phase 4.5 by:

1. **Centralized Shortcuts Registry**: Single source of truth for all shortcuts
2. **Help Modal**: Press `?` to view all shortcuts, platform-aware display
3. **Cross-Browser Testing**: All major browsers tested and verified
4. **Mobile Polish**: Responsive design, touch targets meet WCAG standards
5. **Accessibility Audit**: WCAG 2.1 Level AA compliance verified
6. **Production Readiness**: Zero console errors, professional polish

**Confidence Score: 9/10** - Excellent foundation with existing shortcuts infrastructure, well-understood patterns, comprehensive testing procedures

**Ready for Phase 5** - Clean, tested, production-ready codebase prepared for cloud integration

---

*End of PRP 4: Keyboard Shortcuts Help System + Phase 4.5 Polish*
