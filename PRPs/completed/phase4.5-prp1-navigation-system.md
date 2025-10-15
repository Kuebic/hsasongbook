# PRP: Phase 4.5.1 - Global Navigation System & Mobile Enhancements

**Feature**: Implement global navigation header with responsive design, z-index management system, and enhanced mobile navigation

**Estimated Time**: 5 hours

**Dependencies**: None (foundational feature for Phase 4.5)

---

## Goal

**Feature Goal**: Create a consistent, accessible, and performant navigation system that works seamlessly across mobile and desktop viewports, eliminating navigation dead-ends and providing clear app hierarchy.

**Deliverable**:
- Global app header with sticky positioning (desktop)
- Enhanced MobileNav with proper touch targets and z-index management
- Centralized z-index configuration system
- Skip-to-content link for WCAG 2.4.1 compliance
- App shell pattern with React Router Outlet

**Success Definition**:
- Users can navigate between all major sections (Search, Setlists, Settings) from any page
- No z-index stacking conflicts between nav components and modals
- Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
- Mobile nav buttons meet 44x44px minimum touch target size
- Lighthouse accessibility score ≥ 90
- All validation gates pass (typecheck, lint, build)

---

## User Persona

**Target User**: Worship leaders and musicians using HSA Songbook on mobile phones and desktop computers

**Use Case**:
- **Mobile**: Browsing songs during rehearsal, need quick access to setlists
- **Desktop**: Planning setlists at home, editing chord charts

**User Journey**:
1. User opens app on mobile during band practice
2. Searches for a song
3. Views arrangement
4. Wants to add to setlist → needs to navigate to setlists page
5. **Current Problem**: No visible way to access setlists from arrangement page (mobile nav only has Back/Home)
6. **Solution**: Enhanced mobile nav with 3 buttons (Back, Home, Setlists)

**Desktop Journey**:
1. User opens app on laptop to prepare for Sunday service
2. Wants to browse between Songs and Setlists
3. **Current Problem**: No desktop navigation header (only mobile bottom nav)
4. **Solution**: Persistent header with app title + navigation links

**Pain Points Addressed**:
- ❌ **Current**: Navigation dead-ends (can't get to setlists from deep pages)
- ✅ **Fixed**: Always-visible nav links to major sections
- ❌ **Current**: Inconsistent z-index values cause stacking conflicts (MobileNav and UpdateNotification both z-50)
- ✅ **Fixed**: Centralized z-index system prevents conflicts
- ❌ **Current**: No skip-to-content for keyboard users (WCAG 2.4.1 violation)
- ✅ **Fixed**: Accessible skip link for keyboard navigation

---

## Why

**Business Value**:
- **Reduces user friction**: 3-click max to reach any major section
- **Improves accessibility**: WCAG 2.4.1 compliance opens app to more users
- **Professional appearance**: Persistent header establishes brand identity
- **Mobile-first PWA**: Optimized thumb-zone navigation for 75% of mobile users

**Integration with Existing Features**:
- **Phase 4 Setlists**: Users need easy access to setlist management from anywhere
- **Phase 3 ChordPro Editor**: Users switching between editing and browsing need clear navigation
- **Phase 5 Cloud Sync** (future): Header will host user profile menu and sync status

**Problems This Solves**:
1. **For mobile users**: No way to access setlists without going back to home first
2. **For desktop users**: No persistent navigation or app branding
3. **For keyboard users**: Can't skip repetitive navigation (WCAG violation)
4. **For developers**: Z-index conflicts require manual debugging and create visual bugs

---

## What

**User-Visible Behavior**:

**Mobile (< 768px)**:
- Bottom navigation bar with 3 buttons: Back, Home, Setlists
- Each button: 48px tall (proper touch target size)
- Active state visual feedback (scale-95 on press)
- Auto-hides on scroll down, reveals on scroll up
- Skip-to-content link appears on keyboard focus

**Desktop (≥ 768px)**:
- Sticky header at top with:
  - Logo/title on left: "HSA Songbook"
  - Navigation links on right: Search | Setlists
  - Future: User menu (Phase 5)
- Header is 64px tall, sticks to top on scroll
- Active page highlighted with accent background
- Skip-to-content link appears on keyboard focus

**All Viewports**:
- Skip-to-content link (hidden, visible on Tab key focus)
- Consistent z-index stacking (no visual conflicts)
- Keyboard navigation works (Tab, Enter, Escape)
- ARIA landmarks properly labeled

**Technical Requirements**:
- TypeScript strict mode compliance
- Responsive Tailwind utilities (`md:` breakpoint at 768px)
- React 19 patterns (no deprecated APIs)
- shadcn/ui Button and NavLink components
- Lucide React icons (Home, List, Search, Menu)
- No prop drilling (use hooks for navigation state)

### Success Criteria

**Functional**:
- [ ] Desktop header shows on screens ≥ 768px
- [ ] Mobile nav shows on screens < 768px (never both at once)
- [ ] All navigation links work correctly (no 404s)
- [ ] Back button uses browser history (`navigate(-1)`)
- [ ] Home button navigates to '/'
- [ ] Setlists button navigates to '/setlists'
- [ ] Active page is visually indicated (`aria-current="page"`)

**Accessibility**:
- [ ] Skip-to-content link is keyboard accessible (Tab to reach)
- [ ] Skip link jumps to `#main-content` (all pages have this ID)
- [ ] All interactive elements have ARIA labels
- [ ] Navigation landmarks have `role="navigation"` and unique `aria-label`
- [ ] Focus indicators are visible (2px ring, sufficient contrast)
- [ ] Keyboard navigation works without mouse (Tab, Shift+Tab, Enter)

**Visual/UX**:
- [ ] Mobile nav buttons are 48x48px (proper touch targets)
- [ ] Active touch state provides feedback (scale-95 animation)
- [ ] Header has backdrop blur effect (frosted glass on scroll)
- [ ] Z-index stacking is correct (modals above nav, nav above content)
- [ ] No layout shift when nav appears/disappears

**Performance**:
- [ ] Navigation components are not re-rendered unnecessarily
- [ ] Scroll listener uses passive flag (performance)
- [ ] No console errors or warnings
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Bundle size increase < 5KB gzipped

**Code Quality**:
- [ ] TypeScript strict mode passes (0 errors)
- [ ] ESLint passes (0 warnings)
- [ ] All components have proper TypeScript interfaces
- [ ] Vertical slice architecture followed (`src/features/shared/components/`)
- [ ] Z-index values come from centralized config
- [ ] No hardcoded magic numbers or strings

---

## All Needed Context

### Context Completeness Check

✅ **This PRP provides**:
- Complete navigation pattern analysis from 5 research agents
- Existing codebase patterns with file paths and line numbers
- WCAG accessibility requirements with code examples
- Z-index management system design
- Touch target sizing guidelines (44-48px minimum)
- Thumb zone ergonomics research
- PWA navigation best practices
- Vertical slice architecture boundaries
- shadcn/ui component usage patterns
- React Router v7 NavLink patterns

### Documentation & References

```yaml
# Official Documentation
- url: https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html
  why: WCAG 2.4.1 requirement for skip-to-content link implementation
  critical: Skip link must be keyboard accessible and jump to main content

- url: https://tailwindcss.com/docs/responsive-design
  why: Mobile-first responsive design pattern with breakpoints
  critical: Unprefixed = mobile, md: = tablet/desktop (768px+)

- url: https://ui.shadcn.com/docs/components/navigation-menu
  why: shadcn/ui navigation menu patterns (if using dropdown menus)
  critical: Radix UI primitives handle keyboard navigation automatically

- url: https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/
  why: Thumb zone ergonomics for mobile navigation placement
  critical: 75% of mobile interactions are thumb-driven, bottom nav is optimal

- url: https://css-tricks.com/systems-for-z-index/
  why: Z-index management system to prevent stacking conflicts
  critical: Use centralized config, not arbitrary values

# Existing Codebase Patterns
- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/shared/components/MobileNav.tsx
  why: Current mobile navigation implementation to enhance (not replace)
  pattern: Auto-hide on scroll, useNavigation hook, Button variants
  gotcha: Currently uses z-50 (conflicts with UpdateNotification), size="sm" may be too small
  lines: 1-63 (complete component)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/shared/hooks/useNavigation.ts
  why: Centralized navigation logic with breadcrumbs and helper functions
  pattern: goToSearch(), goToSong(), goBack(), currentPath state
  gotcha: Async breadcrumb loading from IndexedDB (may cause empty state flash)
  lines: 1-77 (complete hook)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/shared/components/Breadcrumbs.tsx
  why: Existing breadcrumb component pattern for hierarchy
  pattern: Home icon, chevron separators, last item non-clickable
  gotcha: Truncates on mobile (max-w-[200px] sm:max-w-none)
  lines: 1-51 (complete component)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/components/ui/button.jsx
  why: shadcn/ui Button component with variants
  pattern: variant="ghost|default|outline", size="sm|default|lg|icon"
  gotcha: JavaScript file (legacy), but TypeScript can import it

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/app/App.tsx
  why: Current app routing structure to integrate with
  pattern: BrowserRouter, Routes, global components (MobileNav, UpdateNotification)
  gotcha: MobileNav and UpdateNotification both use z-50 (conflict!)
  lines: 90-112 (AppWithFeatures component)

- file: /home/kenei/code/github/Kuebic/hsasongbook/tailwind.config.js
  why: Existing Tailwind configuration to extend with z-index values
  pattern: Custom 2xl breakpoint (1400px), container config
  gotcha: Don't override existing config, only extend
  lines: 1-74 (complete config)

# PWA-Specific Considerations
- docfile: PRPs/ai_docs/PWA-Navigation-Research-Report.md
  why: Comprehensive PWA navigation patterns and accessibility guidelines
  section: "Section 3: Mobile Navigation & Thumb Zone Best Practices"
  critical: 44-48px touch targets, 8px spacing, touch-manipulation CSS

- docfile: PRPs/ai_docs/PWA-Navigation-Research-Report.md
  section: "Section 5: Z-Index Management System"
  critical: Centralized z-index config prevents arbitrary values and conflicts

# Vertical Slice Architecture
- docfile: PRPs/ai_docs/Vertical-Slice-Architecture-Analysis.md
  why: Guidelines for where navigation code belongs (features/shared/)
  section: "Section 4: Feature Boundaries"
  critical: Navigation is shared infrastructure (not a feature-specific concern)
```

### Current Codebase Tree (Relevant Sections)

```bash
hsasongbook/
├── src/
│   ├── app/
│   │   ├── App.tsx                      # Current routing (lines 90-112)
│   │   └── main.tsx                     # React entry point
│   ├── components/
│   │   └── ui/
│   │       ├── button.jsx               # shadcn/ui Button (variants, sizes)
│   │       └── (other shadcn/ui components)
│   ├── features/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── MobileNav.tsx        # EXISTING (to enhance)
│   │   │   │   ├── Breadcrumbs.tsx      # Existing pattern reference
│   │   │   │   └── ScrollRestoration.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useNavigation.ts     # EXISTING (navigation helpers)
│   │   │   │   └── useKeyboardShortcuts.ts
│   │   │   └── pages/
│   │   │       └── NotFound.tsx
│   │   ├── pwa/
│   │   │   └── components/
│   │   │       ├── UpdateNotification.tsx  # CONFLICT: also uses z-50
│   │   │       └── OfflineIndicator.tsx
│   │   ├── search/
│   │   ├── songs/
│   │   ├── arrangements/
│   │   └── setlists/
│   ├── lib/
│   │   ├── config/
│   │   │   └── (future: zIndex.ts)      # TO CREATE
│   │   ├── logger.ts
│   │   └── utils.ts                     # cn() helper
│   └── types/                           # Global types
├── tailwind.config.js                   # TO MODIFY (extend z-index)
└── index.html                           # TO MODIFY (add skip link target)
```

### Desired Codebase Tree (Files to Add)

```bash
src/
├── lib/
│   └── config/
│       └── zIndex.ts                    # NEW: Centralized z-index system
│           # Exports Z_INDEX constant with semantic keys
│           # Used by all components for consistent stacking
│
├── features/
│   └── shared/
│       └── components/
│           ├── DesktopHeader.tsx        # NEW: Sticky top navigation
│           │   # Logo, app title, nav links
│           │   # Hidden on mobile (md:hidden)
│           │   # Sticky positioning with backdrop blur
│           │
│           ├── MobileNav.tsx            # MODIFY: Enhanced version
│           │   # Add 3rd button (Setlists)
│           │   # Fix z-index (use Z_INDEX.mobileNav)
│           │   # Ensure 48px height (proper touch targets)
│           │   # Add touch-manipulation CSS
│           │
│           ├── SkipLink.tsx             # NEW: WCAG 2.4.1 skip-to-content
│           │   # Hidden by default, visible on keyboard focus
│           │   # Links to #main-content
│           │   # Fixed positioning, highest z-index
│           │
│           └── AppShell.tsx             # NEW: Layout wrapper (optional)
│               # Combines DesktopHeader, main content, MobileNav
│               # Uses React Router <Outlet />
│               # Provides consistent structure

# Files to Modify
src/app/App.tsx                          # Add SkipLink, optionally use AppShell
src/features/pwa/components/UpdateNotification.tsx  # Fix z-index conflict
tailwind.config.js                       # Extend theme.zIndex with custom values
index.html (or each page)                # Add id="main-content" to <main> elements
```

### Vertical Slice Architecture Analysis

**Existing Feature Slices** (Current HSA Songbook):
```yaml
src/features/shared/:           # Shared infrastructure (navigation belongs here)
  - components/                 # MobileNav, Breadcrumbs, ScrollRestoration
  - hooks/                      # useNavigation, useKeyboardShortcuts
  - utils/                      # Helper functions
  - pages/                      # NotFound page

src/features/search/:           # Search functionality
  - components/                 # SearchBar, SongList
  - pages/                      # SearchPage

src/features/setlists/:         # Setlist management (Phase 4)
  - components/                 # SetlistCard, SetlistForm, etc.
  - hooks/                      # useSetlistData, useSetlists
  - pages/                      # SetlistsIndexPage, SetlistPage, SetlistPerformancePage
```

**Feature Boundary Definition**:
- **Navigation Slice Owns**:
  - Global app navigation (header, mobile nav)
  - Routing utilities (useNavigation hook)
  - Accessibility infrastructure (skip links, ARIA landmarks)
  - Z-index management (centralized config)
  - Layout structure (app shell pattern)

- **Dependencies On Other Slices**:
  - ❌ **NONE** - Navigation is foundational, no feature dependencies
  - ✅ **Reverse dependency**: All features depend on navigation (import from shared)

- **Shared/Common Code**:
  - Uses shadcn/ui components (`Button`, future: `NavigationMenu`)
  - Uses Lucide React icons (`Home`, `List`, `Search`, `Menu`)
  - Uses Tailwind utility classes
  - Uses `lib/utils.ts` for `cn()` helper

- **Slice Isolation**:
  - Lives in `features/shared/` (shared infrastructure layer)
  - No imports from feature slices (`search`, `songs`, `arrangements`, `setlists`)
  - Only exports public API via `features/shared/components/` (no index.ts needed - direct imports OK)

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: React 19 - No deprecated APIs
// ❌ Don't use findDOMNode, componentWillMount, UNSAFE_* lifecycle methods
// ✅ Use refs, useEffect, functional components

// CRITICAL: React Router v7 - NavLink active state
import { NavLink } from 'react-router-dom';

<NavLink
  to="/setlists"
  className={({ isActive }) => cn(
    "base-classes",
    isActive && "active-classes"  // ✅ Function receives isActive boolean
  )}
  aria-current={({ isActive }) => (isActive ? 'page' : undefined)}  // ✅ ARIA
/>
// GOTCHA: className and aria-current receive function, not string

// CRITICAL: Tailwind responsive design - Mobile-first approach
// ❌ WRONG: sm:block (means "show on small screens and up")
<div className="sm:block md:hidden">Mobile Nav</div>

// ✅ CORRECT: Unprefixed = mobile, md: = tablet/desktop
<div className="block md:hidden">Mobile Nav</div>  // Shows on mobile only
<div className="hidden md:block">Desktop Header</div>  // Shows on tablet+ only

// CRITICAL: Z-index stacking context
// Creating new stacking context breaks z-index hierarchy!
// ❌ Avoid: position: fixed + transform (creates new context)
<div className="fixed top-0 transform translate-x-0">  // NEW stacking context!
  <div className="z-50">This won't stack correctly with parent z-index</div>
</div>

// ✅ Use: position: fixed without transform
<div className="fixed top-0 left-0 z-50">
  <div>Stacks correctly relative to parent</div>
</div>

// CRITICAL: Touch target sizing (WCAG 2.5.5)
// ❌ Too small: size="sm" (Tailwind default is 32px)
<Button size="sm">Back</Button>  // 32px height - too small for mobile!

// ✅ Correct: Explicit height class
<Button className="h-12">Back</Button>  // 48px height - optimal touch target

// CRITICAL: Scroll listener performance
// ❌ Non-passive listener blocks scrolling
window.addEventListener('scroll', handler);  // Blocks main thread!

// ✅ Passive listener for better performance
window.addEventListener('scroll', handler, { passive: true });  // Non-blocking

// CRITICAL: TypeScript strict mode - Null checks required
const element = document.querySelector('#main-content');
element.scrollIntoView();  // ❌ TypeScript error: element might be null

// ✅ Null check first
const element = document.querySelector('#main-content');
if (element) {
  element.scrollIntoView();  // ✅ Type-safe
}

// GOTCHA: HSA Songbook uses strict TypeScript mode
// All code must pass: npm run typecheck (tsc --noEmit)
// 0 `any` types allowed (ESLint enforces no-explicit-any)
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// ================================
// src/lib/config/zIndex.ts
// ================================
// Centralized z-index management system
// Prevents conflicts and provides semantic naming

/**
 * Z-Index Stacking Order for HSA Songbook PWA
 *
 * Layer hierarchy from lowest to highest:
 * - Base (0): Default document flow
 * - Dropdown (1000): Dropdown menus, popovers
 * - Sticky (1020): Sticky headers/footers
 * - Fixed Nav (1030-1040): Mobile and desktop navigation
 * - Overlay (1050-1070): Backdrops, modals, drawers
 * - Notifications (1080-1090): Toasts, update prompts
 * - Tooltip (1100): Highest priority UI elements
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  mobileNav: 1030,
  desktopHeader: 1040,
  backdrop: 1050,
  modal: 1060,
  drawer: 1070,
  toast: 1080,
  updateNotification: 1090,
  skipLink: 1100,  // Always on top for accessibility
  tooltip: 1100,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;

/**
 * Get Tailwind z-index class for a semantic layer
 * @example getZIndexClass('mobileNav') => 'z-[1030]'
 */
export function getZIndexClass(layer: ZIndexLayer): string {
  return `z-[${Z_INDEX[layer]}]`;
}

/**
 * Get raw z-index value for inline styles
 * @example getZIndexValue('modal') => 1060
 */
export function getZIndexValue(layer: ZIndexLayer): number {
  return Z_INDEX[layer];
}
```

```typescript
// ================================
// Component Prop Interfaces
// ================================

// SkipLink component
interface SkipLinkProps {
  targetId?: string;  // Default: 'main-content'
  children?: React.ReactNode;  // Default: "Skip to main content"
}

// DesktopHeader component
interface DesktopHeaderProps {
  className?: string;  // Additional Tailwind classes
}

// MobileNav component (existing, enhanced)
interface MobileNavProps {
  className?: string;  // Additional Tailwind classes
}

// AppShell component (optional layout wrapper)
interface AppShellProps {
  children?: React.ReactNode;  // If not using React Router Outlet
}
```

### Implementation Tasks (Ordered by Vertical Slice Completion)

**Priority 1: Foundation (Z-Index System)**
```yaml
Task 1: CREATE src/lib/config/zIndex.ts
  IMPLEMENT: Centralized z-index configuration with semantic naming
  DEPENDENCIES: None (foundational)
  FILE SIZE: ~100 lines (with comments)
  VALIDATION:
    - npm run typecheck (must pass)
    - Import test: import { Z_INDEX } from '@/lib/config/zIndex'
  SLICE BOUNDARY: Core infrastructure (lib/ directory)
  WHY FIRST: All navigation components depend on this for consistent stacking

Task 2: MODIFY tailwind.config.js
  IMPLEMENT: Extend theme.zIndex with Z_INDEX values
  DEPENDENCIES: Task 1 (imports Z_INDEX)
  CHANGES: Add zIndex: Z_INDEX to theme.extend
  VALIDATION:
    - npm run dev (Tailwind should rebuild config)
    - Verify z-mobileNav utility works in component
  GOTCHA: Don't override existing config, use extend
```

**Priority 2: Accessibility (Skip Link)**
```yaml
Task 3: CREATE src/features/shared/components/SkipLink.tsx
  IMPLEMENT: WCAG 2.4.1 skip-to-content link
  DEPENDENCIES: Task 1 (imports Z_INDEX.skipLink)
  PATTERN: Visually hidden, visible on :focus, keyboard accessible
  FILE SIZE: ~40 lines
  VALIDATION:
    - Tab key shows link at top-left
    - Clicking link scrolls to #main-content
    - ESLint & TypeScript pass
  ARIA: Uses semantic <a> tag, href="#main-content"
  PLACEMENT: features/shared/components/ (shared infrastructure)
  SLICE BOUNDARY: No dependencies on other features

Task 4: MODIFY index.html or page components
  IMPLEMENT: Add id="main-content" to main element
  DEPENDENCIES: Task 3 (SkipLink target)
  CHANGES:
    - SearchPage: <main id="main-content" ...>
    - SongPage: <main id="main-content" ...>
    - All other pages
  ALTERNATIVE: Add in AppShell wrapper (Task 7)
  VALIDATION: Click skip link, verify scroll to content
```

**Priority 3: Desktop Navigation**
```yaml
Task 5: CREATE src/features/shared/components/DesktopHeader.tsx
  IMPLEMENT: Sticky top navigation header for desktop
  DEPENDENCIES: Task 1 (Z_INDEX), useNavigation hook (exists)
  PATTERN: Sticky positioning, backdrop blur, responsive (hidden < md)
  FILE SIZE: ~100 lines
  FEATURES:
    - Logo/title: "HSA Songbook" with Home icon
    - Nav links: Search, Setlists (NavLink with active state)
    - Responsive: hidden md:block
    - Z-index: z-[1040] (desktopHeader)
    - Backdrop blur: bg-background/95 backdrop-blur
  VALIDATION:
    - Shows on screens ≥ 768px
    - Hidden on screens < 768px
    - Active page highlighted
    - Sticky on scroll
  ARIA: role="banner", nav has role="navigation" and aria-label
  SLICE BOUNDARY: No feature dependencies (uses shared hooks only)

Task 6: MODIFY src/features/shared/components/MobileNav.tsx
  IMPLEMENT: Enhance existing mobile nav with fixes
  DEPENDENCIES: Task 1 (Z_INDEX), useNavigation hook (exists)
  CHANGES:
    - Add 3rd button (Setlists) with List icon
    - Change z-50 to z-[1030] (Z_INDEX.mobileNav)
    - Change size="sm" to className="h-12" (48px touch target)
    - Add touch-manipulation class
    - Add active:scale-95 for tactile feedback
    - Add aria-label to all buttons
    - Add aria-current="page" to active button
  FILE SIZE: ~80 lines (enhanced from 63 lines)
  VALIDATION:
    - All 3 buttons visible
    - Each button 48x48px (inspect in DevTools)
    - Active button highlighted
    - Touch feedback on mobile
  GOTCHA: Don't break existing auto-hide on scroll behavior
```

**Priority 4: Layout Integration (Optional)**
```yaml
Task 7: CREATE src/features/shared/components/AppShell.tsx (OPTIONAL)
  IMPLEMENT: Layout wrapper with React Router Outlet
  DEPENDENCIES: Tasks 3, 5, 6 (SkipLink, DesktopHeader, MobileNav)
  PATTERN: Layout component with Outlet for nested routing
  FILE SIZE: ~60 lines
  STRUCTURE:
    <div>
      <SkipLink />
      <DesktopHeader className="hidden md:block" />
      <main id="main-content" tabIndex={-1}>
        <Outlet />  {/* Child routes render here */}
      </main>
      <MobileNav className="md:hidden" />
    </div>
  ALTERNATIVE: Keep current App.tsx structure (render components globally)
  VALIDATION:
    - Child routes render in <Outlet />
    - Layout persists across route changes
    - No layout shift or flicker
  WHEN TO SKIP: If app structure is simple, AppShell adds complexity

Task 8: MODIFY src/app/App.tsx
  IMPLEMENT: Integrate new navigation components
  DEPENDENCIES: All previous tasks
  CHANGES:
    - Option A (with AppShell):
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<SearchPage />} />
            ...other routes
          </Route>
        </Routes>
    - Option B (without AppShell):
        - Add <SkipLink /> as first child in AppWithFeatures()
        - Add <DesktopHeader className="hidden md:block" />
        - Keep existing MobileNav (now enhanced)
  VALIDATION:
    - npm run dev starts without errors
    - Navigate between pages, nav persists
    - Responsive breakpoints work (mobile/desktop)
```

**Priority 5: Fix Z-Index Conflicts**
```yaml
Task 9: MODIFY src/features/pwa/components/UpdateNotification.tsx
  IMPLEMENT: Fix z-index conflict (currently z-50, conflicts with MobileNav)
  DEPENDENCIES: Task 1 (Z_INDEX)
  CHANGES: Replace z-50 with z-[1090] (Z_INDEX.updateNotification)
  LINES TO CHANGE: 33, 154, 188, 230 (all notification variants)
  VALIDATION:
    - UpdateNotification appears above MobileNav
    - No visual overlap or flickering
    - Can still interact with notification buttons
  GOTCHA: UpdateNotification has 4 variants (top, bottom, fab, inline)
```

### Implementation Patterns & Key Details

```typescript
// ================================
// PATTERN: SkipLink Component
// ================================
// src/features/shared/components/SkipLink.tsx

import { getZIndexClass } from '@/lib/config/zIndex';

interface SkipLinkProps {
  targetId?: string;
  children?: React.ReactNode;
}

export default function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content'
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={`
        absolute left-0 top-0
        ${getZIndexClass('skipLink')}
        -translate-y-full
        focus:translate-y-0
        bg-primary text-primary-foreground
        px-4 py-2 rounded-b-md
        font-medium
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        transition-transform
      `}
    >
      {children}
    </a>
  );
}

// CRITICAL: Must be first focusable element in DOM (add to App.tsx first)
// WCAG 2.4.1: Provides mechanism to bypass repeated navigation blocks
```

```typescript
// ================================
// PATTERN: DesktopHeader Component
// ================================
// src/features/shared/components/DesktopHeader.tsx

import { NavLink } from 'react-router-dom';
import { Home, List, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getZIndexClass } from '@/lib/config/zIndex';

interface DesktopHeaderProps {
  className?: string;
}

export default function DesktopHeader({ className }: DesktopHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 w-full border-b",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        getZIndexClass('desktopHeader'),
        className
      )}
      role="banner"
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo/Branding */}
        <div className="flex items-center space-x-2">
          <Home className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">HSA Songbook</h1>
        </div>

        {/* Navigation Links */}
        <nav role="navigation" aria-label="Main navigation">
          <ul className="flex items-center space-x-6">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => cn(
                  "inline-flex items-center space-x-2 px-3 py-2 rounded-md",
                  "text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isActive && "bg-accent text-accent-foreground"
                )}
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/setlists"
                className={({ isActive }) => cn(
                  "inline-flex items-center space-x-2 px-3 py-2 rounded-md",
                  "text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isActive && "bg-accent text-accent-foreground"
                )}
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <List className="h-4 w-4" />
                <span>Setlists</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

// CRITICAL: React Router v7 NavLink className receives function
// GOTCHA: isActive prop is passed to both className and aria-current
// PATTERN: backdrop-blur requires supports-[backdrop-filter] for Safari
```

```typescript
// ================================
// PATTERN: Enhanced MobileNav
// ================================
// src/features/shared/components/MobileNav.tsx (modifications)

// BEFORE (current implementation):
<Button variant="ghost" size="sm" onClick={goBack} className="flex-1">
  <ArrowLeft className="h-5 w-5" />
  <span className="ml-2 text-xs">Back</span>
</Button>

// AFTER (enhanced implementation):
<Button
  variant="ghost"
  onClick={goBack}
  aria-label="Go back"
  className="
    flex-1 h-12
    touch-manipulation
    active:scale-95
    transition-transform
    focus:outline-none focus:ring-2 focus:ring-ring
  "
>
  <ArrowLeft className="h-5 w-5" />
  <span className="ml-2 text-sm">Back</span>
</Button>

// CHANGES:
// 1. Remove size="sm" (too small), add explicit h-12 (48px touch target)
// 2. Add touch-manipulation (disables double-tap zoom on mobile)
// 3. Add active:scale-95 (visual feedback on press)
// 4. Add aria-label for screen readers
// 5. Increase text size: text-xs → text-sm
// 6. Add focus ring for keyboard navigation

// Z-INDEX FIX:
// BEFORE: className="... z-50 ..."
// AFTER:
import { getZIndexClass } from '@/lib/config/zIndex';
// ...
className={cn(
  "fixed bottom-0 left-0 right-0",
  getZIndexClass('mobileNav'),  // z-[1030]
  // ... other classes
)}

// ADD 3RD BUTTON (Setlists):
<Button
  variant="ghost"
  onClick={() => navigate('/setlists')}
  aria-label="View setlists"
  aria-current={currentPath.startsWith('/setlist') ? 'page' : undefined}
  className="flex-1 h-12 touch-manipulation active:scale-95 transition-transform"
>
  <List className="h-5 w-5" />
  <span className="ml-2 text-sm">Sets</span>
</Button>

// GOTCHA: aria-current should be set on active button for accessibility
// PATTERN: Use currentPath from useNavigation hook to determine active state
```

```typescript
// ================================
// PATTERN: AppShell Layout (Optional)
// ================================
// src/features/shared/components/AppShell.tsx

import { Outlet } from 'react-router-dom';
import SkipLink from './SkipLink';
import DesktopHeader from './DesktopHeader';
import MobileNav from './MobileNav';

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />

      {/* Desktop Header (hidden on mobile) */}
      <DesktopHeader className="hidden md:block" />

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 pb-16 md:pb-0"  // Padding for mobile nav
      >
        <Outlet />  {/* Page content renders here */}
      </main>

      {/* Mobile Nav (hidden on desktop) */}
      <MobileNav className="md:hidden" />
    </div>
  );
}

// CRITICAL: <Outlet /> renders child routes
// GOTCHA: tabIndex={-1} makes main programmatically focusable (for skip link)
// PATTERN: pb-16 on mobile (space for bottom nav), md:pb-0 on desktop
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after EACH file creation/modification

# Type checking (strict mode)
npm run typecheck
# Expected: 0 errors

# Linting
npm run lint
# Expected: 0 errors, 0 warnings

# If errors:
# 1. READ the error message carefully
# 2. Check file path and line number
# 3. Common issues:
#    - Missing imports
#    - Incorrect TypeScript types
#    - ARIA attribute typos
#    - Missing null checks (strict mode)

# Quick component test (after creating DesktopHeader)
npm run dev
# Open http://localhost:5173
# Resize browser window (should see header on desktop, not mobile)
# Press F12, check for console errors
```

### Level 2: Component Validation

```bash
# After creating SkipLink
# 1. Start dev server
npm run dev

# 2. Open app in browser
# 3. Press Tab key (skip link should appear at top-left)
# 4. Press Enter (should scroll to main content)
# 5. Verify: focus moves to main content area

# After creating DesktopHeader
# 1. Open app on desktop viewport (≥ 768px)
# 2. Verify header is visible and sticky
# 3. Click "Search" link → verify navigation works
# 4. Click "Setlists" link → verify navigation works
# 5. Verify active page is highlighted

# After enhancing MobileNav
# 1. Open app on mobile viewport (< 768px)
# 2. Verify 3 buttons visible (Back, Home, Setlists)
# 3. Tap each button → verify navigation works
# 4. Measure button height in DevTools → should be 48px
# 5. Verify active page button is highlighted
# 6. Scroll down page → nav should hide
# 7. Scroll up page → nav should reveal
```

### Level 3: Integration Testing

```bash
# Full app navigation test
npm run dev

# Test flow:
# 1. Start on homepage (Search page)
# 2. Tab key to skip link → press Enter
# 3. Search for a song → click result
# 4. On song page: click arrangement
# 5. On arrangement page:
#    - Desktop: Click "Setlists" in header
#    - Mobile: Tap "Sets" button in bottom nav
# 6. Verify navigation worked at each step
# 7. Use browser back button → verify history works

# Z-index stacking test
# 1. Trigger UpdateNotification (if available)
# 2. Verify notification appears above MobileNav
# 3. Open a modal/dialog (if available)
# 4. Verify modal appears above navigation
# 5. No visual overlap or z-index conflicts

# Production build
npm run build
# Expected: Successful build, no TypeScript errors

npm run preview
# Test all navigation flows in production mode
# Verify no differences from dev mode
```

### Level 4: Creative & Domain-Specific Validation

```bash
# WCAG Accessibility Audit
npm run pwa:audit
# Or use Chrome DevTools → Lighthouse tab
# Run "Accessibility" audit
# Expected: Score ≥ 90
# Check: "Bypass Blocks" (skip link) passes

# Manual accessibility testing
# Keyboard-only navigation (no mouse):
# 1. Tab through entire page
# 2. Verify focus indicators are visible on all elements
# 3. Press Enter to activate links/buttons
# 4. Verify no keyboard traps (can always move focus away)

# Screen reader testing (if available):
# - macOS: VoiceOver (Cmd+F5)
# - Windows: NVDA (free) or JAWS
# - Test: Skip link announcement, nav landmark announcement

# Touch target sizing (mobile)
# 1. Open Chrome DevTools → Device Mode
# 2. Enable "Show rulers"
# 3. Inspect each mobile nav button
# 4. Verify: width ≥ 44px, height ≥ 44px
# 5. Verify: 8px spacing between buttons (no accidental taps)

# Z-index visual inspection
# Chrome DevTools → Layers panel (3D view)
# 1. Check stacking order matches design
# 2. UpdateNotification (1090) > MobileNav (1030) > Content (0)
# 3. No unexpected stacking contexts

# Responsive breakpoint testing
# Test at these viewport widths:
# - 375px (iPhone SE) - mobile nav only
# - 768px (iPad) - transition point
# - 1024px (laptop) - desktop header
# - 1440px (large desktop) - desktop header

# Performance check
npm run build
# Check build output for bundle size
# Navigation components should add < 5KB gzipped

# Verify no console errors/warnings in production
npm run preview
# Open browser console
# Navigate through app
# Expected: No errors or warnings
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run build` succeeds
- [ ] `npm run preview` runs without errors
- [ ] No console errors in browser (dev and preview modes)
- [ ] All TypeScript interfaces properly defined
- [ ] Z-index values come from centralized config (no magic numbers)

### Feature Validation

- [ ] **Desktop Header**:
  - [ ] Shows on screens ≥ 768px
  - [ ] Hidden on screens < 768px
  - [ ] Sticky on scroll
  - [ ] Logo and title visible
  - [ ] Navigation links work (Search, Setlists)
  - [ ] Active page highlighted with aria-current="page"

- [ ] **Mobile Nav**:
  - [ ] Shows on screens < 768px
  - [ ] Hidden on screens ≥ 768px
  - [ ] 3 buttons visible (Back, Home, Setlists)
  - [ ] Each button 48x48px (proper touch targets)
  - [ ] Auto-hides on scroll down, reveals on scroll up
  - [ ] Active button highlighted
  - [ ] Touch feedback on press (scale-95)

- [ ] **Skip Link**:
  - [ ] Hidden by default
  - [ ] Visible when Tab key pressed
  - [ ] Links to #main-content
  - [ ] Scrolls to content when activated
  - [ ] Highest z-index (always on top)

- [ ] **Z-Index System**:
  - [ ] No stacking conflicts
  - [ ] UpdateNotification above MobileNav
  - [ ] Modals above navigation (if tested)
  - [ ] All components use Z_INDEX config

### Accessibility Validation (WCAG 2.1)

- [ ] **Keyboard Navigation**:
  - [ ] Tab key moves through skip link → nav links → content
  - [ ] Shift+Tab moves backwards
  - [ ] Enter activates links and buttons
  - [ ] Focus indicators visible (2px ring, sufficient contrast)
  - [ ] No keyboard traps

- [ ] **ARIA & Semantics**:
  - [ ] Skip link uses semantic <a> tag
  - [ ] Header has role="banner"
  - [ ] Nav elements have role="navigation"
  - [ ] Multiple nav elements have unique aria-label
  - [ ] Active page has aria-current="page"
  - [ ] Icon-only buttons have aria-label

- [ ] **Lighthouse Audit**:
  - [ ] Accessibility score ≥ 90
  - [ ] "Bypass Blocks" check passes (skip link)
  - [ ] "Touch targets" check passes (44x44px minimum)
  - [ ] "ARIA attributes" check passes

- [ ] **Screen Reader** (if available):
  - [ ] Skip link is announced
  - [ ] Navigation landmarks are announced
  - [ ] Current page is announced
  - [ ] Link text is descriptive

### UX/Visual Validation

- [ ] **Responsive Design**:
  - [ ] Mobile nav shows only on mobile
  - [ ] Desktop header shows only on desktop
  - [ ] No visual overlap at breakpoints
  - [ ] Content area has proper padding (mobile: pb-16, desktop: pb-0)

- [ ] **Visual Polish**:
  - [ ] Backdrop blur effect works (header)
  - [ ] Active state styling is clear
  - [ ] Hover states work on desktop
  - [ ] Touch feedback works on mobile (scale-95)
  - [ ] No layout shift when nav appears/disappears

- [ ] **Performance**:
  - [ ] No unnecessary re-renders (check React DevTools Profiler)
  - [ ] Scroll listener uses passive flag
  - [ ] Navigation components memoized if needed
  - [ ] Bundle size increase < 5KB gzipped

### Code Quality Validation

- [ ] **Vertical Slice Architecture**:
  - [ ] All files in `features/shared/` (correct location)
  - [ ] No imports from feature slices (search, songs, setlists)
  - [ ] Only imports from shared infrastructure (hooks, utils)
  - [ ] Z-index config in `lib/config/` (core infrastructure)

- [ ] **TypeScript**:
  - [ ] All components have prop interfaces
  - [ ] No `any` types (strict mode enforced)
  - [ ] Null checks for DOM queries (`document.querySelector`)
  - [ ] Event handlers properly typed (React.MouseEvent, etc.)

- [ ] **Best Practices**:
  - [ ] Uses `cn()` helper for className merging
  - [ ] Uses Lucide React icons (no inline SVGs)
  - [ ] Uses shadcn/ui Button component
  - [ ] Follows existing patterns (Breadcrumbs, MobileNav as reference)
  - [ ] No hardcoded strings (use constants if needed)

---

## Anti-Patterns to Avoid

**General Anti-Patterns:**
- ❌ Don't use arbitrary z-index values (z-50, z-999) → Use Z_INDEX config
- ❌ Don't skip skip-link implementation → WCAG 2.4.1 requirement
- ❌ Don't make touch targets < 44x44px → Use h-12 (48px) for mobile buttons
- ❌ Don't use size="sm" for mobile buttons → Too small for touch
- ❌ Don't forget responsive breakpoints → Mobile-first approach

**Vertical Slice Architecture Anti-Patterns:**
- ❌ Don't put navigation in a feature slice (`features/navigation/`) → Use `features/shared/`
- ❌ Don't import from other features → Navigation is foundational, no feature dependencies
- ❌ Don't create circular dependencies → shared/ is a base layer

**React/TypeScript Anti-Patterns:**
- ❌ Don't use deprecated React APIs → React 19 removes findDOMNode, UNSAFE_* methods
- ❌ Don't use `any` type → TypeScript strict mode enforces no-explicit-any
- ❌ Don't skip null checks → `element?.scrollIntoView()` or `if (element) { ... }`
- ❌ Don't use className as string with NavLink → Use function for isActive

**Accessibility Anti-Patterns:**
- ❌ Don't remove focus outlines (`outline: none`) → Use custom focus ring instead
- ❌ Don't use `onClick` without keyboard support → Use <button> or <a>, not <div>
- ❌ Don't skip ARIA labels on icon-only buttons → Screen readers need text
- ❌ Don't forget aria-current="page" → Indicates current location to screen readers

**Performance Anti-Patterns:**
- ❌ Don't use non-passive scroll listeners → Blocks main thread
- ❌ Don't create new stacking contexts unintentionally → Avoid `transform` with `position: fixed`
- ❌ Don't re-render on every scroll event → Use throttle/debounce if needed (current MobileNav is OK)

**PWA-Specific Anti-Patterns:**
- ❌ Don't block with heavy synchronous operations → Keep UI responsive
- ❌ Don't forget safe-area-inset for notched devices → Use `safe-area-inset-bottom` class (future)

---

## Success Score Estimation

**Confidence Level for One-Pass Implementation**: 9/10

**Why High Confidence**:
✅ Complete research from 5 specialized agents covering:
  - Navigation patterns (existing and recommended)
  - Z-index management (current conflicts identified)
  - Accessibility requirements (WCAG 2.4.1, 2.5.5)
  - Touch target sizing (44-48px guidelines)
  - PWA best practices (thumb zone, bottom nav)
  - Vertical slice architecture (clear boundaries)

✅ Comprehensive context:
  - Existing file paths with line numbers
  - Code snippets showing patterns to follow
  - Known gotchas identified and documented
  - Library quirks explained (React Router NavLink, Tailwind responsive)

✅ Clear implementation order:
  - Start with foundation (z-index config)
  - Build incrementally (skip link → header → mobile nav)
  - Test at each step (validation gates)
  - No dependencies blocking progress

✅ Detailed validation gates:
  - 4 levels of validation (syntax, component, integration, accessibility)
  - Specific commands to run
  - Expected outputs documented
  - Manual testing procedures

**Minor Risk (-1 point)**:
- AppShell pattern is optional (could add complexity if misused)
- Mobile nav auto-hide behavior needs careful testing (existing code works, don't break it)
- Responsive breakpoints need visual verification at multiple sizes

**Mitigation**:
- Skip AppShell if unsure (use simpler App.tsx modification)
- Don't modify scroll behavior in MobileNav (only z-index, buttons, sizing)
- Test at 375px, 768px, 1024px viewports (documented in validation)

---

## Additional Notes

**Phase 4.5 Context**: This is PRP 1 of 4 for Phase 4.5 (UX Polish & Pre-Cloud Preparation)
- **PRP 1** (this): Navigation System (5 hrs)
- **PRP 2** (next): Dark Mode + Theme System (5 hrs)
- **PRP 3** (next): Enhanced Search/Homepage (4 hrs)
- **PRP 4** (next): Keyboard Shortcuts + Polish (6 hrs)

**Dependencies for Future PRPs**:
- PRP 2 (Dark Mode) will add ThemeToggle to DesktopHeader
- PRP 3 (Enhanced Search) will use the navigation structure created here
- PRP 4 (Keyboard Shortcuts) will document navigation shortcuts

**Related Files to Read**:
- `/home/kenei/code/github/Kuebic/hsasongbook/CLAUDE.md` - Phase 4.5 overview (lines 132-210)
- `/home/kenei/code/github/Kuebic/hsasongbook/src/features/shared/hooks/useKeyboardShortcuts.ts` - Keyboard navigation patterns

**Testing Resources**:
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools Lighthouse: F12 → Lighthouse tab → Accessibility audit
- React DevTools: Install extension for component profiling

---

*End of PRP - Phase 4.5.1: Global Navigation System*
