# PRP: Phase 4.5.2 - Dark Mode + Theme System + Settings Page

**Feature**: Implement dark mode with theme provider, system preference detection, and settings page foundation

**Estimated Time**: 5 hours

**Dependencies**: PRP 1 (Navigation System) - ThemeToggle will be added to DesktopHeader

---

## Goal

**Feature Goal**: Create a complete dark mode system that respects user preferences, persists across sessions, prevents FOUC (flash of unstyled content), and provides a settings page for theme configuration.

**Deliverable**:
- Theme provider with React Context (light/dark/system modes)
- Theme toggle component with dropdown UI (Sun/Moon icons)
- FOUC prevention via blocking inline script in index.html
- System preference detection with change listener
- Settings page with Appearance section
- localStorage persistence for theme preference

**Success Definition**:
- User can switch between light, dark, and system themes
- Theme preference persists on page reload
- No flash of wrong theme on initial page load
- System theme changes are detected and applied automatically (when mode is "system")
- All colors meet WCAG contrast requirements (4.5:1 minimum)
- Theme toggle is accessible (keyboard + screen reader)
- Lighthouse accessibility score ≥ 90

---

## User Persona

**Target User**: Worship leaders and musicians using HSA Songbook in varying lighting conditions

**Use Cases**:
1. **Sanctuary Rehearsal (Dark)**: User practicing in dim sanctuary before service, needs dark mode to reduce screen glare
2. **Office Planning (Light)**: User creating setlists during daytime in bright office, prefers light mode
3. **System Preference (Auto)**: User wants app to match OS theme automatically (dark at night, light during day)

**User Journey**:
1. User opens app for first time → sees light mode (default)
2. Clicks theme toggle → selects "Dark mode"
3. App switches to dark theme instantly
4. User closes app and reopens → dark theme persists (localStorage)
5. User changes OS theme from light to dark → app updates automatically (if system mode selected)

**Pain Points Addressed**:
- ❌ **Current**: No dark mode option (causes eye strain in low-light environments)
- ✅ **Fixed**: Three theme options (light, dark, system)
- ❌ **Current**: No user preferences (app looks same for everyone)
- ✅ **Fixed**: Settings page foundation for future preferences
- ❌ **Current**: FOUC when using class-based dark mode
- ✅ **Fixed**: Blocking script prevents theme flash

---

## Why

**Business Value**:
- **Accessibility**: Dark mode reduces eye strain for 80% of users who prefer it
- **User Retention**: Theme preference is a top-3 UX request for modern apps
- **Professional Polish**: Settings page establishes UI foundation for Phase 5 features
- **PWA Best Practice**: Respecting system preferences improves app rating

**Integration with Existing Features**:
- **Phase 4.5.1 Navigation**: ThemeToggle added to DesktopHeader and Settings page
- **Phase 3 ChordPro**: Dark mode CSS already exists (`chordpro.css` lines 218-231)
- **Phase 5 Cloud Sync** (future): Theme preference will sync to Supabase
- **Existing CSS**: Dark mode variables already defined in `index.css`

**Problems This Solves**:
1. **For users**: Eye strain in low-light environments (sanctuary, late-night planning)
2. **For developers**: Foundation for user preferences (ready for Phase 5 auth/sync)
3. **For accessibility**: Respects system preferences (WCAG guideline, not requirement)
4. **For UX**: Prevents jarring theme flash on page load (FOUC)

---

## What

**User-Visible Behavior**:

**Theme Modes**:
1. **Light Mode**: White background, dark text (current default)
2. **Dark Mode**: Dark background (#050914), light text (#F9FAFB)
3. **System Mode**: Matches OS theme automatically, updates on OS theme change

**Theme Toggle UI**:
- **Location**: DesktopHeader (right side, before user menu) and Settings page
- **Component**: Dropdown with 3 options (Light, Dark, System)
- **Visual**: Sun icon (light), Moon icon (dark), animated transition
- **Keyboard**: Tab to focus, Enter to open, Arrow keys to select, Enter to confirm

**Settings Page**:
- **Route**: `/settings`
- **Sections**:
  - **Appearance**: Theme toggle (light/dark/system)
  - **About**: App version, storage quota, database stats
  - **Account**: Placeholder for Phase 5 auth ("Sign in to sync across devices")
- **Navigation**: Accessible from DesktopHeader and MobileNav (future)

**Technical Requirements**:
- React 19 Context API for theme state
- localStorage key: `hsasongbook-theme`
- Inline script in index.html (prevents FOUC)
- System theme detection via `window.matchMedia('(prefers-color-scheme: dark)')`
- CSS class toggle on `document.documentElement` (`.dark` class)
- TypeScript strict mode compliance
- No `any` types (enforced by ESLint)

### Success Criteria

**Functional**:
- [ ] Theme toggle dropdown has 3 options (Light, Dark, System)
- [ ] Clicking option changes theme instantly (no page reload)
- [ ] Theme persists on page reload (localStorage)
- [ ] System mode respects OS preference
- [ ] System theme changes are detected and applied automatically
- [ ] Theme applies to all pages (Search, Songs, Arrangements, Setlists)
- [ ] ChordPro viewer uses dark mode styles (already exists)

**Visual/UX**:
- [ ] No FOUC on page load (theme applied before React hydrates)
- [ ] Theme transition is smooth (CSS transition on colors)
- [ ] Sun/Moon icons animate on toggle (rotate, scale)
- [ ] Active theme is indicated in dropdown (checkmark or highlight)
- [ ] Dark mode meets WCAG contrast requirements (4.5:1 for text)

**Accessibility**:
- [ ] Theme toggle is keyboard accessible (Tab, Enter, Arrow keys)
- [ ] Theme toggle has ARIA label ("Toggle theme")
- [ ] Dropdown menu has proper ARIA attributes (role, expanded, etc.)
- [ ] Focus indicators visible in both light and dark modes
- [ ] Screen reader announces theme change ("Dark mode activated")

**Settings Page**:
- [ ] Settings page accessible via route `/settings`
- [ ] Appearance section shows theme toggle
- [ ] About section shows app version and storage info
- [ ] Account section shows placeholder for Phase 5
- [ ] Navigation works (back button, breadcrumbs)

**Performance**:
- [ ] Inline script < 500 bytes (minimized)
- [ ] Theme toggle renders without delay
- [ ] localStorage operations are async (don't block UI)
- [ ] No unnecessary re-renders (theme state memoized)
- [ ] Bundle size increase < 3KB gzipped

**Code Quality**:
- [ ] TypeScript strict mode passes (0 errors)
- [ ] ESLint passes (0 warnings)
- [ ] All components have proper TypeScript interfaces
- [ ] Theme provider follows React Context best practices
- [ ] Uses centralized config (no magic strings)

---

## All Needed Context

### Context Completeness Check

✅ **This PRP provides**:
- Complete dark mode research (FOUC prevention, system detection, localStorage)
- Existing HSA Songbook infrastructure analysis (CSS variables, ChordPro dark styles)
- shadcn/ui theme toggle pattern (official recommendation)
- WCAG contrast requirements (16.5:1 current light, 16.3:1 current dark - excellent)
- React 19 Context API patterns
- Vertical slice architecture (theme is shared infrastructure)

### Documentation & References

```yaml
# Official Documentation
- url: https://ui.shadcn.com/docs/dark-mode/vite
  why: Official shadcn/ui dark mode pattern for Vite projects
  critical: ThemeProvider pattern, FOUC prevention script, dropdown UI

- url: https://tailwindcss.com/docs/dark-mode
  why: Tailwind CSS class-based dark mode configuration
  critical: darkMode: ["class"] already configured in tailwind.config.js

- url: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
  why: System theme detection with window.matchMedia()
  critical: Listen for OS theme changes with addEventListener('change')

- url: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
  why: WCAG 2.1 contrast requirements for accessible text
  critical: 4.5:1 minimum for normal text, 3:1 for large text/UI components

# FOUC Prevention Research
- docfile: PRPs/ai_docs/React-Dark-Mode-Research-Report.md
  section: "Section 5: Preventing FOUC (Flash of Unstyled Content)"
  why: Critical inline script pattern to prevent theme flash
  critical: Script must run BEFORE React hydration, be < 500 bytes

# Existing Codebase Patterns
- file: /home/kenei/code/github/Kuebic/hsasongbook/src/index.css
  why: Dark mode CSS variables already defined (lines 6-66)
  pattern: HSL color system with :root (light) and .dark (dark) variants
  gotcha: Variables are complete - no CSS changes needed
  lines: 6-66 (complete color system)

- file: /home/kenei/code/github/Kuebic/hsasongbook/tailwind.config.js
  why: Dark mode already configured with class-based approach
  pattern: darkMode: ["class"] enables .dark class toggle
  gotcha: Tailwind v3.4.17 (not v4) - use JavaScript config, not CSS
  lines: 1-74 (complete config)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/features/chordpro/styles/chordpro.css
  why: ChordPro viewer already has dark mode styles
  pattern: .dark .chord-sheet-output { /* dark styles */ }
  gotcha: Will work automatically when .dark class is applied
  lines: 218-231 (dark mode styles)

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/components/ui/dropdown-menu.jsx
  why: shadcn/ui dropdown menu component for theme toggle
  pattern: Radix UI primitive with keyboard navigation
  gotcha: JavaScript file (legacy), but TypeScript can import it

- file: /home/kenei/code/github/Kuebic/hsasongbook/src/components/ui/button.jsx
  why: Button component for theme toggle trigger
  pattern: variant="outline", size="icon" for icon-only buttons
  gotcha: JavaScript file (legacy), but TypeScript can import it

# Vertical Slice Architecture
- docfile: PRPs/ai_docs/Vertical-Slice-Architecture-Analysis.md
  section: "Section 4: Feature Boundaries - What Belongs in a Feature?"
  why: Determine if theme is feature vs shared infrastructure
  critical: Theme is shared infrastructure (like navigation), lives in lib/

# Context & State Management
- docfile: PRPs/ai_docs/Theme-Infrastructure-Analysis.md
  section: "Section 3: React Context Patterns"
  why: Zero existing React Contexts in HSA Songbook (clean slate)
  critical: No conflicts, first Context implementation
```

### Current Codebase Tree (Relevant Sections)

```bash
hsasongbook/
├── index.html                           # TO MODIFY: Add FOUC prevention script
├── src/
│   ├── app/
│   │   ├── App.tsx                      # TO MODIFY: Wrap with ThemeProvider
│   │   └── main.tsx                     # React entry point
│   ├── components/
│   │   └── ui/
│   │       ├── button.jsx               # EXISTING: Use for toggle trigger
│   │       ├── dropdown-menu.jsx        # EXISTING: Use for theme selector
│   │       └── card.jsx                 # EXISTING: Use for Settings page
│   ├── features/
│   │   ├── shared/
│   │   │   └── components/
│   │   │       ├── DesktopHeader.tsx    # TO MODIFY: Add ThemeToggle
│   │   │       └── MobileNav.tsx        # (Future: add theme toggle)
│   │   └── (other features)
│   ├── lib/
│   │   ├── config/
│   │   │   └── (theme config if needed) # OPTIONAL
│   │   ├── logger.ts                    # EXISTING: Use for debug logging
│   │   └── utils.ts                     # EXISTING: cn() helper
│   ├── index.css                        # EXISTING: Dark mode vars defined
│   └── types/                           # Global types
├── tailwind.config.js                   # EXISTING: darkMode: ["class"]
└── public/
    └── manifest.json                    # OPTIONAL: Update theme_color
```

### Desired Codebase Tree (Files to Add)

```bash
src/
├── lib/
│   └── theme/                           # NEW: Theme infrastructure
│       ├── ThemeProvider.tsx            # NEW: React Context provider
│       ├── ThemeToggle.tsx              # NEW: Dropdown toggle component
│       └── types.ts                     # NEW: Theme-related types
│
├── features/
│   └── settings/                        # NEW: Settings feature module
│       ├── pages/
│       │   └── SettingsPage.tsx         # NEW: Main settings page
│       ├── components/
│       │   ├── AppearanceSection.tsx    # NEW: Theme toggle section
│       │   ├── AboutSection.tsx         # NEW: App info section
│       │   └── AccountSection.tsx       # NEW: Auth placeholder
│       └── index.ts                     # NEW: Barrel export

# Files to Modify
index.html                               # Add inline FOUC prevention script
src/app/App.tsx                          # Wrap with ThemeProvider
src/features/shared/components/DesktopHeader.tsx  # Add ThemeToggle
src/app/App.tsx                          # Add /settings route
```

### Vertical Slice Architecture Analysis

**Theme Infrastructure Placement**:
```yaml
# Decision: Theme is SHARED INFRASTRUCTURE (not a feature)
# Similar to navigation (PRP 1), theme affects entire app

src/lib/theme/:                          # Core theme system
  - ThemeProvider.tsx                    # Global React Context
  - ThemeToggle.tsx                      # Reusable UI component
  - types.ts                             # Theme type definitions
  # Why lib/: Used by all features, no business logic

src/features/settings/:                  # Settings feature module
  - pages/SettingsPage.tsx               # Settings UI
  - components/                          # Settings-specific components
  # Why features/: User-facing feature with routing
```

**Feature Boundary Definition**:
- **Theme System Owns**:
  - Theme state management (React Context)
  - Theme persistence (localStorage)
  - System preference detection
  - Theme application logic (CSS class toggle)

- **Settings Feature Owns**:
  - Settings page UI
  - Settings navigation and routing
  - User preferences presentation
  - Foundation for Phase 5 preferences

- **Dependencies**:
  - Theme system: No dependencies (foundational)
  - Settings feature: Depends on theme system (imports ThemeToggle)

- **Shared/Common Code**:
  - Uses shadcn/ui components (DropdownMenu, Button, Card)
  - Uses Tailwind CSS utilities
  - Uses existing color variables (index.css)

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: FOUC Prevention - Inline Script Placement
// Script MUST be in <head> or very early <body>, BEFORE React
// ❌ WRONG: Putting script in React component (runs too late)
// ❌ WRONG: Using dangerouslySetInnerHTML (runs after hydration)
// ✅ CORRECT: Plain <script> tag in index.html

<!-- index.html - FOUC prevention script -->
<script>
  // Runs BEFORE React loads, applies theme immediately
  (function() {
    const theme = localStorage.getItem('hsasongbook-theme') || 'system';
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
    }
  })();
</script>

// CRITICAL: React 19 Context API - Use hook or useContext
import { createContext, useContext } from 'react';

const ThemeContext = createContext(undefined);

// ❌ WRONG: Accessing context outside provider
const theme = useContext(ThemeContext);  // Might be undefined!

// ✅ CORRECT: Custom hook with error handling
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// CRITICAL: System Theme Detection - MediaQueryList API
// ❌ WRONG: Checking once on mount
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// ✅ CORRECT: Listening for OS theme changes
useEffect(() => {
  if (theme !== 'system') return;  // Only listen in system mode

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    document.documentElement.classList.toggle('dark', e.matches);
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}, [theme]);

// GOTCHA: Chrome sometimes reports incorrect matches value
// Solution: Always provide manual override (theme toggle)

// CRITICAL: localStorage Error Handling
// Private browsing mode blocks localStorage
// ❌ WRONG: Assuming localStorage always works
localStorage.setItem('theme', 'dark');  // Throws in private mode!

// ✅ CORRECT: Try/catch with fallback
try {
  localStorage.setItem('hsasongbook-theme', theme);
} catch (error) {
  logger.warn('Failed to save theme preference (private browsing?)');
  // App still works, just doesn't persist
}

// CRITICAL: TypeScript Strict Mode - Type Guards
// ❌ WRONG: Assuming string is Theme type
const theme = localStorage.getItem('theme');  // string | null

// ✅ CORRECT: Type guard for theme validation
type Theme = 'light' | 'dark' | 'system';

const isValidTheme = (value: string | null): value is Theme => {
  return value === 'light' || value === 'dark' || value === 'system';
};

const stored = localStorage.getItem('hsasongbook-theme');
const theme: Theme = isValidTheme(stored) ? stored : 'system';

// GOTCHA: Tailwind CSS v3 vs v4 - Config Differences
// Current: v3.4.17 (uses JavaScript config)
// ❌ Don't migrate to v4 CSS config yet (not stable)
// ✅ Use existing tailwind.config.js with darkMode: ["class"]

// CRITICAL: React Router v7 - Adding new route
// ❌ WRONG: Forgetting to add route to App.tsx
<Routes>
  {/* Missing /settings route */}
</Routes>

// ✅ CORRECT: Add route with element
<Routes>
  <Route path="/" element={<SearchPage />} />
  <Route path="/settings" element={<SettingsPage />} />
  {/* ... other routes */}
</Routes>
```

---

## Implementation Blueprint

### Data Models and Structure

```typescript
// ================================
// src/lib/theme/types.ts
// ================================

/**
 * Theme options for HSA Songbook
 * - light: Force light mode
 * - dark: Force dark mode
 * - system: Match OS preference (auto-switching)
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Theme provider state interface
 */
export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * Validate if a string is a valid theme
 */
export function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}
```

```typescript
// ================================
// Settings Page Component Props
// ================================

// AppearanceSection
interface AppearanceSectionProps {
  // No props needed - uses useTheme() hook
}

// AboutSection
interface AboutSectionProps {
  appVersion?: string;  // Default: package.json version
}

// AccountSection
interface AccountSectionProps {
  isAuthenticated?: boolean;  // Default: false (Phase 5)
}

// SettingsPage
interface SettingsPageProps {
  // No props needed - composes sections
}
```

### Implementation Tasks (Ordered by Vertical Slice Completion)

**Priority 1: Theme Infrastructure**
```yaml
Task 1: CREATE src/lib/theme/types.ts
  IMPLEMENT: Type definitions for theme system
  DEPENDENCIES: None (foundational)
  FILE SIZE: ~60 lines (with comments)
  EXPORTS: Theme, ThemeProviderState, ThemeProviderProps, isValidTheme
  VALIDATION:
    - npm run typecheck (must pass)
    - Import test: import { Theme } from '@/lib/theme/types'
  SLICE BOUNDARY: Core infrastructure (lib/ directory)

Task 2: CREATE src/lib/theme/ThemeProvider.tsx
  IMPLEMENT: React Context provider for theme management
  DEPENDENCIES: Task 1 (imports types)
  FILE SIZE: ~120 lines (with comments)
  PATTERN: Follow shadcn/ui official pattern (see context below)
  FEATURES:
    - createContext with ThemeProviderState
    - useState for theme state
    - useEffect for applying theme class to document
    - useEffect for system theme change listener
    - localStorage get/set with error handling
    - Custom useTheme hook with error boundary
  VALIDATION:
    - npm run typecheck
    - Test: Wrap test component, call useTheme()
  CRITICAL: Must handle localStorage errors (private browsing)

Task 3: CREATE src/lib/theme/ThemeToggle.tsx
  IMPLEMENT: Dropdown menu for theme selection
  DEPENDENCIES: Task 2 (imports useTheme)
  FILE SIZE: ~100 lines
  PATTERN: shadcn/ui DropdownMenu with Sun/Moon icons
  FEATURES:
    - Button trigger with Sun icon (light) / Moon icon (dark)
    - Animated icon transition (rotate, scale)
    - Dropdown with 3 items: Light, Dark, System
    - Active theme indicated (checkmark or highlight)
    - Keyboard accessible (Tab, Enter, Arrow keys)
  VALIDATION:
    - npm run typecheck
    - Render in test page, verify dropdown works
    - Check keyboard navigation (Tab, Enter, Arrows)
  ARIA: Button has aria-label, dropdown has role="menu"
```

**Priority 2: FOUC Prevention**
```yaml
Task 4: MODIFY index.html
  IMPLEMENT: Add inline blocking script to prevent FOUC
  DEPENDENCIES: Task 1 (uses 'hsasongbook-theme' storage key)
  CHANGES: Add <script> in <head> before any CSS
  SCRIPT SIZE: < 500 bytes (minified)
  CODE:
    <script>
      (function(){const t=localStorage.getItem("hsasongbook-theme")||"system",e=document.documentElement;if("dark"===t)e.classList.add("dark");else if("system"===t){window.matchMedia("(prefers-color-scheme: dark)").matches&&e.classList.add("dark")}})();
    </script>
  VALIDATION:
    - Reload page with dark mode → no flash of light theme
    - Reload page with light mode → no flash of dark theme
    - System mode → matches OS preference immediately
  CRITICAL: Script must be minimized (< 500 bytes)
  GOTCHA: Don't use "async" or "defer" (must block)

Task 5: MODIFY src/app/App.tsx
  IMPLEMENT: Wrap app with ThemeProvider
  DEPENDENCIES: Task 2 (imports ThemeProvider)
  CHANGES:
    - Import ThemeProvider from '@/lib/theme/ThemeProvider'
    - Wrap <ErrorBoundary> with <ThemeProvider>
    - Props: defaultTheme="system", storageKey="hsasongbook-theme"
  PATTERN:
    function App() {
      return (
        <ThemeProvider defaultTheme="system" storageKey="hsasongbook-theme">
          <ErrorBoundary ...>
            <BrowserRouter>
              <AppWithFeatures />
            </BrowserRouter>
          </ErrorBoundary>
        </ThemeProvider>
      );
    }
  VALIDATION:
    - npm run dev
    - Open DevTools → Elements → <html> tag
    - Verify .dark class is present (if theme is dark)
    - Change theme → verify class toggles
```

**Priority 3: Settings Page**
```yaml
Task 6: CREATE src/features/settings/pages/SettingsPage.tsx
  IMPLEMENT: Main settings page with sections
  DEPENDENCIES: Task 3 (imports ThemeToggle)
  FILE SIZE: ~150 lines
  STRUCTURE:
    - Breadcrumbs (Home → Settings)
    - Page header ("Settings")
    - AppearanceSection (theme toggle)
    - AboutSection (app version, storage)
    - AccountSection (Phase 5 placeholder)
  PATTERN: Uses shadcn/ui Card components
  VALIDATION:
    - npm run typecheck
    - Render at /settings route
    - All sections visible
  SLICE BOUNDARY: Settings feature module

Task 7: CREATE src/features/settings/components/AppearanceSection.tsx
  IMPLEMENT: Theme settings section
  DEPENDENCIES: Task 3 (uses ThemeToggle)
  FILE SIZE: ~60 lines
  STRUCTURE:
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the look and feel</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <Label>Theme</Label>
          <ThemeToggle />
          <p className="text-sm text-muted-foreground">
            Choose light, dark, or sync with your system
          </p>
        </div>
      </CardContent>
    </Card>
  VALIDATION:
    - Theme toggle works
    - Visual styling matches app design

Task 8: CREATE src/features/settings/components/AboutSection.tsx
  IMPLEMENT: App information section
  DEPENDENCIES: None
  FILE SIZE: ~80 lines
  STRUCTURE:
    - App version (from package.json or hardcoded)
    - Build date
    - Database stats (song count, arrangement count, setlist count)
    - Storage quota (current / total)
  PATTERN: Uses getDatabaseStats() from existing PWA code
  VALIDATION:
    - Stats load correctly
    - Storage quota displays
  GOTCHA: Storage API might not be available in all browsers

Task 9: CREATE src/features/settings/components/AccountSection.tsx
  IMPLEMENT: Authentication placeholder
  DEPENDENCIES: None
  FILE SIZE: ~50 lines
  STRUCTURE:
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Sign in to sync your data across devices and collaborate with your team.
        </p>
        <Button variant="outline" disabled>
          Sign In (Coming in Phase 5)
        </Button>
      </CardContent>
    </Card>
  VALIDATION:
    - Renders correctly
    - Button is disabled
  FUTURE: Replace with real auth in Phase 5

Task 10: CREATE src/features/settings/index.ts
  IMPLEMENT: Barrel export for settings feature
  DEPENDENCIES: Tasks 6-9
  FILE SIZE: ~10 lines
  EXPORTS: SettingsPage
  PATTERN: export { SettingsPage } from './pages/SettingsPage'
  VALIDATION:
    - Import test: import { SettingsPage } from '@/features/settings'
```

**Priority 4: Integration**
```yaml
Task 11: MODIFY src/app/App.tsx (add route)
  IMPLEMENT: Add /settings route
  DEPENDENCIES: Task 10 (imports SettingsPage)
  CHANGES:
    - Import SettingsPage
    - Add route: <Route path="/settings" element={<SettingsPage />} />
  LOCATION: Inside <Routes>, before 404 route
  VALIDATION:
    - Navigate to /settings → page loads
    - Back button works

Task 12: MODIFY src/features/shared/components/DesktopHeader.tsx (optional)
  IMPLEMENT: Add ThemeToggle to header
  DEPENDENCIES: Task 3 (imports ThemeToggle)
  CHANGES:
    - Import ThemeToggle
    - Add to right side of header (before future user menu)
    - Styling: Align with nav links
  CODE:
    <div className="flex items-center space-x-4">
      <nav>...</nav>
      <ThemeToggle />  {/* Add here */}
    </div>
  VALIDATION:
    - Toggle appears in header (desktop only)
    - Works correctly (changes theme)
  OPTIONAL: Can skip if prefer settings page only
```

### Implementation Patterns & Key Details

```typescript
// ================================
// PATTERN: ThemeProvider (Complete Implementation)
// ================================
// src/lib/theme/ThemeProvider.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import type { Theme, ThemeProviderProps, ThemeProviderState } from './types';
import { isValidTheme } from './types';
import logger from '@/lib/logger';

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'hsasongbook-theme',
  ...props
}: ThemeProviderProps) {
  // Initialize theme from localStorage with validation
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return isValidTheme(stored) ? stored : defaultTheme;
    } catch (error) {
      logger.warn('Failed to read theme from localStorage (private browsing?)');
      return defaultTheme;
    }
  });

  // Apply theme class to document root
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove both classes to ensure clean state
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Listen for system theme changes (only in system mode)
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (error) {
        logger.warn('Failed to save theme preference');
      }
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Custom hook with error boundary
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// CRITICAL: This pattern follows shadcn/ui official recommendation
// GOTCHA: System theme listener only active when theme === 'system'
// PATTERN: localStorage errors are caught and logged (private browsing mode)
```

```typescript
// ================================
// PATTERN: ThemeToggle (Complete Implementation)
// ================================
// src/lib/theme/ThemeToggle.tsx

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Toggle theme">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// CRITICAL: Animated icon transition using Tailwind classes
// - Light mode: Sun visible (scale-100), Moon hidden (scale-0)
// - Dark mode: Sun hidden (-rotate-90 scale-0), Moon visible (rotate-0 scale-100)
// PATTERN: Two overlapping icons with opposite transitions
// GOTCHA: .sr-only text for screen readers ("Toggle theme")
// ARIA: Button has aria-label for accessibility
```

```typescript
// ================================
// PATTERN: SettingsPage (Structure)
// ================================
// src/features/settings/pages/SettingsPage.tsx

import { useNavigation } from '@/features/shared/hooks/useNavigation';
import Breadcrumbs from '@/features/shared/components/Breadcrumbs';
import AppearanceSection from '../components/AppearanceSection';
import AboutSection from '../components/AboutSection';
import AccountSection from '../components/AccountSection';

export default function SettingsPage() {
  const { breadcrumbs } = useNavigation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your app preferences and account settings
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <AppearanceSection />
        <AboutSection />
        <AccountSection />
      </div>
    </div>
  );
}

// PATTERN: Container with max-width (max-w-4xl)
// PATTERN: Space between sections (space-y-6)
// PATTERN: Breadcrumbs from useNavigation hook
```

```typescript
// ================================
// PATTERN: AppearanceSection (with ThemeToggle)
// ================================
// src/features/settings/components/AppearanceSection.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/lib/theme/ThemeToggle';

export default function AppearanceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how the app looks and feels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="theme-toggle">Theme</Label>
            <p className="text-sm text-muted-foreground">
              Select your preferred theme or sync with your system
            </p>
          </div>
          <ThemeToggle />
        </div>
      </CardContent>
    </Card>
  );
}

// PATTERN: Card with header and content
// PATTERN: flex justify-between for label + control layout
// PATTERN: muted-foreground for help text
```

```typescript
// ================================
// PATTERN: AboutSection (Database Stats)
// ================================
// src/features/settings/components/AboutSection.tsx

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDatabaseStats } from '@/features/pwa/db/database';
import type { DatabaseStats } from '@/features/pwa/db/database';

export default function AboutSection() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDatabaseStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load database stats:', error);
      }
    };
    loadStats();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Songs</p>
            <p className="text-lg font-semibold">{stats?.songs ?? '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Arrangements</p>
            <p className="text-lg font-semibold">{stats?.arrangements ?? '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Setlists</p>
            <p className="text-lg font-semibold">{stats?.setlists ?? '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Version</p>
            <p className="text-lg font-semibold">0.0.0</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// PATTERN: useEffect to load async data on mount
// PATTERN: grid layout for stats (grid-cols-2 gap-4)
// PATTERN: Nullish coalescing for loading state (stats?.songs ?? '-')
// GOTCHA: getDatabaseStats() already exists in PWA code
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after EACH file creation

# Type checking (strict mode)
npm run typecheck
# Expected: 0 errors

# Linting
npm run lint
# Expected: 0 errors, 0 warnings

# Common issues:
# - Missing imports (Theme type, useTheme hook)
# - localStorage errors not caught (need try/catch)
# - MediaQueryList type mismatch (use MediaQueryListEvent)
```

### Level 2: Component Validation

```bash
# After creating ThemeProvider
npm run dev
# 1. Open DevTools → Console
# 2. Type: document.documentElement.classList
# 3. Verify: "dark" class present (if OS is dark mode)
# 4. Change theme in DevTools → Application → Local Storage
#    Set "hsasongbook-theme" to "light"
# 5. Reload page → verify light mode (no dark class)

# After creating ThemeToggle
# 1. Add <ThemeToggle /> to a test page
# 2. Click toggle → dropdown should open
# 3. Select "Dark" → page should switch to dark mode
# 4. Select "Light" → page should switch to light mode
# 5. Select "System" → should match OS preference
# 6. Reload page → theme should persist

# After adding FOUC prevention script
# 1. Set localStorage theme to "dark"
# 2. Reload page multiple times (Cmd+R / Ctrl+R)
# 3. Verify: NO flash of light theme
# 4. Should go directly to dark mode
# 5. Same test with "light" theme → no flash of dark

# After creating Settings page
# 1. Navigate to /settings
# 2. All 3 sections visible
# 3. Theme toggle works
# 4. Database stats load
# 5. Account section shows placeholder
```

### Level 3: Integration Testing

```bash
# Full theme switching test
npm run dev

# Test flow:
# 1. Start with system theme (default)
# 2. Verify app matches OS theme
# 3. Change OS theme (System Preferences / Settings)
# 4. Verify app updates automatically
# 5. Switch to light mode (via toggle)
# 6. Change OS theme → verify app DOESN'T change (locked to light)
# 7. Switch to dark mode (via toggle)
# 8. Reload page → verify dark mode persists
# 9. Navigate between pages → verify theme persists
# 10. Clear localStorage → reload → should reset to system

# Keyboard navigation test
# 1. Tab to theme toggle
# 2. Press Enter → dropdown opens
# 3. Press Arrow Down → focus moves to "Dark"
# 4. Press Enter → theme changes, dropdown closes
# 5. Verify focus returns to button

# Contrast testing
# 1. Switch to dark mode
# 2. Open DevTools → Lighthouse → Accessibility
# 3. Run audit
# 4. Check "Background and foreground colors have sufficient contrast"
# 5. Expected: All text passes (4.5:1 minimum)

# Production build
npm run build
# Expected: Successful build, no errors

npm run preview
# 1. Test all theme modes
# 2. Verify FOUC prevention works
# 3. Verify localStorage persistence
```

### Level 4: Creative & Domain-Specific Validation

```bash
# WCAG Accessibility Audit
npm run pwa:audit
# Or: Chrome DevTools → Lighthouse → Accessibility
# Expected: Score ≥ 90
# Check: "Elements with ARIA roles have required attributes" passes
# Check: "Background and foreground colors have sufficient contrast" passes

# Theme toggle accessibility
# Keyboard-only test (no mouse):
# 1. Tab to theme toggle button
# 2. Verify focus indicator visible
# 3. Press Enter → dropdown opens
# 4. Press Arrow keys → navigate options
# 5. Press Enter → select option, close dropdown
# 6. Press Escape (if dropdown open) → close without selecting
# 7. Verify no keyboard traps

# Screen reader test (if available):
# - macOS: VoiceOver (Cmd+F5)
# - Windows: NVDA (free) or JAWS
# Test:
# 1. Focus theme toggle
# 2. Verify: "Toggle theme button"
# 3. Activate → verify: "Light mode activated" (or similar)

# Dark mode visual inspection
# Check these pages in both light and dark modes:
# - Search page (song cards, search input)
# - Song page (arrangement cards, ratings)
# - Arrangement page (ChordPro viewer - should use dark styles)
# - Setlist page (setlist cards, drag-drop UI)
# - Settings page (cards, form controls)
# Verify:
# - All text is readable (sufficient contrast)
# - No visual glitches or overlaps
# - Icons are visible and appropriate color
# - Focus indicators visible in both modes

# Browser compatibility
# Test in:
# - Chrome (latest)
# - Firefox (latest)
# - Safari (latest, macOS/iOS)
# - Edge (latest)
# Verify:
# - Theme switching works
# - System theme detection works
# - localStorage persistence works
# - No console errors

# Performance check
npm run build
# Check build output:
# - Theme provider: < 2KB gzipped
# - Settings page: < 5KB gzipped
# Total bundle size increase: < 10KB

# ChordPro dark mode integration
# 1. Navigate to an arrangement page
# 2. Switch to dark mode
# 3. Verify ChordPro content uses dark styles
# 4. Chords should be blue-400 (not default blue)
# 5. Comments should be gray with darker border
# 6. Verify no white backgrounds (should be dark)
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run build` succeeds
- [ ] `npm run preview` runs without errors
- [ ] No console errors in browser (dev and production)
- [ ] All TypeScript interfaces properly defined
- [ ] No `any` types (strict mode enforced)

### Feature Validation

- [ ] **Theme Provider**:
  - [ ] Wraps entire app in App.tsx
  - [ ] Initializes from localStorage
  - [ ] Handles localStorage errors gracefully (private browsing)
  - [ ] Applies theme class to document root
  - [ ] Detects system theme preference
  - [ ] Listens for OS theme changes (system mode only)

- [ ] **Theme Toggle**:
  - [ ] Dropdown opens on click
  - [ ] 3 options visible (Light, Dark, System)
  - [ ] Clicking option changes theme instantly
  - [ ] Active theme is indicated
  - [ ] Icons animate smoothly (Sun/Moon rotation)
  - [ ] Keyboard accessible (Tab, Enter, Arrows)

- [ ] **FOUC Prevention**:
  - [ ] Inline script in index.html (< 500 bytes)
  - [ ] No flash on page load (theme applied before React)
  - [ ] Works in all 3 modes (light, dark, system)
  - [ ] Script is minimized

- [ ] **Settings Page**:
  - [ ] Accessible via /settings route
  - [ ] Breadcrumbs work
  - [ ] Appearance section with theme toggle
  - [ ] About section with database stats
  - [ ] Account section with placeholder
  - [ ] Navigation works (back button)

- [ ] **Persistence**:
  - [ ] Theme persists on page reload
  - [ ] Theme persists across navigation
  - [ ] localStorage key is correct ("hsasongbook-theme")
  - [ ] Theme resets to system if localStorage cleared

### Accessibility Validation (WCAG 2.1)

- [ ] **Keyboard Navigation**:
  - [ ] Theme toggle is keyboard accessible
  - [ ] Dropdown menu works with Arrow keys
  - [ ] Enter activates selection
  - [ ] Escape closes dropdown
  - [ ] Focus indicators visible in both themes

- [ ] **ARIA & Semantics**:
  - [ ] Theme toggle button has aria-label
  - [ ] Dropdown menu has proper ARIA attributes
  - [ ] Screen reader text for icon-only button (.sr-only)
  - [ ] No ARIA errors in Lighthouse audit

- [ ] **Contrast (WCAG 2.1.1)**:
  - [ ] Light mode: All text ≥ 4.5:1 contrast
  - [ ] Dark mode: All text ≥ 4.5:1 contrast
  - [ ] UI components: ≥ 3:1 contrast
  - [ ] Focus indicators: ≥ 3:1 contrast
  - [ ] No reliance on color alone

- [ ] **Lighthouse Audit**:
  - [ ] Accessibility score ≥ 90
  - [ ] No contrast failures
  - [ ] ARIA attributes valid
  - [ ] Interactive elements keyboard accessible

### UX/Visual Validation

- [ ] **Theme Transitions**:
  - [ ] Smooth transition between light and dark
  - [ ] No jarring color shifts
  - [ ] Icons animate smoothly (rotate, scale)
  - [ ] No layout shift

- [ ] **Dark Mode Appearance**:
  - [ ] All pages render correctly in dark mode
  - [ ] ChordPro viewer uses dark styles
  - [ ] Search input is visible
  - [ ] Cards have proper background
  - [ ] Borders are visible but subtle
  - [ ] Icons are appropriate color

- [ ] **Settings Page Design**:
  - [ ] Consistent with app design
  - [ ] Cards have proper spacing
  - [ ] Typography is clear
  - [ ] Stats layout is readable
  - [ ] Mobile responsive

### Code Quality Validation

- [ ] **Vertical Slice Architecture**:
  - [ ] Theme system in `lib/theme/` (shared infrastructure)
  - [ ] Settings feature in `features/settings/` (feature module)
  - [ ] No cross-feature dependencies
  - [ ] Proper barrel exports (settings/index.ts)

- [ ] **TypeScript**:
  - [ ] All components have prop interfaces
  - [ ] Theme type defined correctly
  - [ ] isValidTheme type guard used
  - [ ] No `any` types (strict mode compliance)
  - [ ] Null checks for localStorage

- [ ] **Best Practices**:
  - [ ] Uses `useTheme()` hook (not direct Context)
  - [ ] Error handling for localStorage
  - [ ] Error handling for getDatabaseStats
  - [ ] Follows existing patterns (Card, Button, etc.)
  - [ ] No hardcoded strings (uses constants)

---

## Anti-Patterns to Avoid

**General Anti-Patterns:**
- ❌ Don't use inline styles for theme → Use Tailwind dark: utilities
- ❌ Don't skip FOUC prevention → Results in jarring flash on page load
- ❌ Don't forget error handling for localStorage → Breaks in private browsing
- ❌ Don't use `any` type → TypeScript strict mode enforced
- ❌ Don't hardcode theme values → Use Theme type

**React/Context Anti-Patterns:**
- ❌ Don't access Context outside provider → Use `useTheme()` hook with error boundary
- ❌ Don't create multiple theme contexts → One global context is sufficient
- ❌ Don't forget cleanup in useEffect → Always return cleanup function
- ❌ Don't listen for system changes in all modes → Only when theme === 'system'

**Performance Anti-Patterns:**
- ❌ Don't make inline script too large → Keep < 500 bytes (minified)
- ❌ Don't use sync localStorage in render → Use in useEffect only
- ❌ Don't re-render unnecessarily → Memoize theme state if needed

**Accessibility Anti-Patterns:**
- ❌ Don't rely on color alone → Use icons, labels, and text
- ❌ Don't forget screen reader text → Use .sr-only on icon buttons
- ❌ Don't skip keyboard navigation → Dropdown must work with keyboard
- ❌ Don't remove focus indicators → Must be visible in both themes

**PWA-Specific Anti-Patterns:**
- ❌ Don't use CSS media query alone → Need JS toggle for user override
- ❌ Don't forget manifest theme_color → Update if app color changes (optional)

---

## Success Score Estimation

**Confidence Level for One-Pass Implementation**: 9/10

**Why High Confidence**:
✅ Complete research from specialized agents:
  - Dark mode infrastructure analysis (Tailwind config, CSS variables already in place)
  - FOUC prevention pattern (inline script < 500 bytes)
  - React Context pattern (zero existing contexts, no conflicts)
  - shadcn/ui ThemeProvider official pattern
  - WCAG contrast requirements (current colors already excellent: 16.5:1 and 16.3:1)

✅ Existing infrastructure ready:
  - Tailwind CSS `darkMode: ["class"]` already configured
  - Dark theme CSS variables already defined (index.css lines 6-66)
  - ChordPro dark mode styles already exist (chordpro.css lines 218-231)
  - No conflicting theme systems

✅ Clear implementation path:
  - Start with types (foundation)
  - Build ThemeProvider (core logic)
  - Add FOUC prevention (critical for UX)
  - Build Settings page (feature layer)
  - Integrate with navigation (PRP 1)

✅ Comprehensive validation:
  - 4 levels (syntax, component, integration, accessibility)
  - Specific test procedures for FOUC, keyboard nav, contrast
  - Lighthouse audit checklist

**Minor Risk (-1 point)**:
- FOUC prevention script must be perfectly placed (before any CSS loads)
- System theme change listener needs careful testing on macOS/Windows
- localStorage private browsing mode edge case

**Mitigation**:
- Detailed inline script placement instructions
- Error handling for localStorage with logger warnings
- Test on multiple browsers and OSes (documented in validation)

---

## Additional Notes

**Phase 4.5 Context**: This is PRP 2 of 4 for Phase 4.5 (UX Polish & Pre-Cloud Preparation)
- **PRP 1** (complete): Navigation System
- **PRP 2** (this): Dark Mode + Theme System
- **PRP 3** (next): Enhanced Search/Homepage
- **PRP 4** (next): Keyboard Shortcuts + Polish

**Dependencies for Future PRPs**:
- PRP 3 (Enhanced Search) will benefit from dark mode testing
- PRP 4 (Keyboard Shortcuts) will document theme toggle shortcut (optional)

**Related Files**:
- `/home/kenei/code/github/Kuebic/hsasongbook/CLAUDE.md` - Phase 4.5 overview
- `/home/kenei/code/github/Kuebic/hsasongbook/src/index.css` - Dark mode CSS variables
- `/home/kenei/code/github/Kuebic/hsasongbook/tailwind.config.js` - Dark mode config

**Future Enhancements (Phase 5)**:
- Sync theme preference to Supabase (user profile)
- Add theme preference to user settings (server-side)
- Consider per-page theme override (advanced)

---

*End of PRP - Phase 4.5.2: Dark Mode + Theme System*
