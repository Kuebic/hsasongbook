# Phase 4.5 PRP5: Profile Navigation Integration - BASE PRP

**Type**: Implementation-Focused BASE PRP
**Status**: Ready for Implementation
**Estimated Effort**: 1.5-3 hours
**Priority**: High (Phase 4.5 requirement)
**Related**: `phase4.5-prp5-profile-navigation-ux-planning.md` (comprehensive planning document)

---

## Goal

**Feature Goal**: Make the existing Profile page (`/profile`) discoverable by adding navigation links to both mobile and desktop navigation systems.

**Deliverable**:
- Profile button in MobileNav (mobile viewport < 768px)
- Profile link in DesktopHeader (desktop viewport ≥ 768px)
- Optional: Install shadcn/ui Avatar component for better profile UX

**Success Definition**:
- Users can navigate to `/profile` from any page via mobile bottom bar or desktop header
- Profile page loads without errors
- Active state highlighting works correctly
- All validation gates pass (typecheck, lint, build)

---

## User Persona

**Target User**: Musicians and worship leaders using HSA Songbook offline-first PWA

**Use Case**: User wants to access their profile to see account placeholder and prepare for Phase 5 authentication

**User Journey**:
1. User opens app (mobile or desktop)
2. User sees Profile button/link in navigation
3. User clicks Profile → navigates to `/profile`
4. Profile page shows "Coming Soon" placeholder for Phase 5 authentication
5. User can return to app or navigate to Settings

**Pain Points Addressed**:
- **Current**: Profile page exists but is completely hidden (orphaned page)
- **Fixed**: Profile accessible from standard navigation locations

---

## Why

- **Phase 4.5 Requirement**: Profile placeholder is a documented Phase 4.5 deliverable (see CLAUDE.md line 46-51)
- **UX Consistency**: Settings has nav link, Profile should too (no orphaned pages)
- **Phase 5 Preparation**: Establishes UI foundation for Supabase authentication
- **User Discoverability**: Eliminates need to manually type `/profile` URL

---

## What

### User-Visible Behavior

**Mobile (< 768px viewport)**:
- Bottom navigation bar shows Profile button
- Recommended: Replace "Back" button with "Profile" (keeps 4-button layout)
- Alternative: Add Profile as 5th button (may feel crowded)
- Active state: `bg-accent text-accent-foreground` when on `/profile`

**Desktop (≥ 768px viewport)**:
- Top header navigation shows Profile link
- Position: Between "Setlists" and "Settings"
- Navigation order: `Search | Setlists | Profile | Settings | [ThemeToggle]`
- Active state: `bg-accent text-accent-foreground` when on `/profile`

**Profile Page** (`/profile`):
- Already exists (103 lines) - no changes needed
- Shows placeholder card with User icon
- "Sign In" button disabled with "(Coming in Phase 5)" label
- Working "Settings" link button
- Feature teaser list (sync, share, collaborate, backup)

### Success Criteria

- [ ] Profile button appears in MobileNav
- [ ] Profile link appears in DesktopHeader
- [ ] User icon imported from lucide-react
- [ ] Active state highlighting works
- [ ] ARIA labels added for accessibility
- [ ] 48px touch targets on mobile (WCAG compliant)
- [ ] Clicking Profile navigates to `/profile`
- [ ] ProfilePage loads without console errors
- [ ] All validation gates pass

---

## All Needed Context

### Context Completeness Check

✅ **Complete**: All necessary files identified, patterns documented, external research completed

### Documentation & References

```yaml
# Official shadcn/ui Documentation
- url: https://ui.shadcn.com/docs/components/avatar
  why: Optional Avatar component for better profile UX
  critical: Use AvatarFallback with User icon for placeholder state
  command: npx shadcn@latest add avatar

# Lucide React Icons
- url: https://lucide.dev/icons/user
  why: User icon for Profile button/link
  critical: Import as 'User' from 'lucide-react', size h-5 w-5 (mobile), h-4 w-4 (desktop)

# WCAG Touch Target Guidelines
- url: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
  why: Mobile touch targets must be 48px minimum
  critical: Already implemented in MobileNav with h-12 class (48px)

# Existing Codebase Patterns (MUST READ)
- file: src/features/shared/components/MobileNav.tsx
  why: Pattern for adding Profile button to mobile navigation
  pattern: |
    - Button with variant="ghost"
    - Icon (h-5 w-5) + Label (text-xs)
    - Active state: currentPath === '/profile' && 'bg-accent'
    - ARIA: aria-label, aria-current, aria-hidden on icon
    - Touch target: h-12 (48px for WCAG)
  gotcha: Use navigate() from useNavigation hook, NOT useNavigate from react-router-dom

- file: src/features/shared/components/DesktopHeader.tsx
  why: Pattern for adding Profile link to desktop navigation
  pattern: |
    - NavLink component (from react-router-dom)
    - className function with isActive prop
    - Icon (h-4 w-4) + Span label
    - Hover: hover:bg-accent
    - Active: isActive && 'bg-accent'
  gotcha: NavLink automatically provides isActive - don't manually check currentPath

- file: src/features/profile/pages/ProfilePage.tsx
  why: Existing profile page (already complete - just needs navigation links)
  pattern: Placeholder page with Card, Button, breadcrumbs, SimplePageTransition
  gotcha: Already has /profile route registered in App.tsx - no routing changes needed

- file: src/features/settings/pages/SettingsPage.tsx
  why: Reference pattern for Phase 4.5 page layout (if enhancing ProfilePage later)
  pattern: Container (max-w-4xl), Breadcrumbs, multi-section card layout
  gotcha: Not needed for this minimal PRP - just navigation integration
```

---

### Current Codebase Tree

```bash
src/
├── app/
│   └── App.tsx                          # Routes: /profile EXISTS (line 117)
│
├── components/ui/                       # shadcn/ui components
│   ├── button.jsx                       # ✅ Available
│   ├── card.jsx                         # ✅ Available
│   ├── badge.jsx                        # ✅ Available
│   ├── dropdown-menu.jsx                # ✅ Available
│   ├── skeleton.jsx                     # ✅ Available
│   └── avatar.tsx                       # ❌ NOT INSTALLED (optional)
│
├── features/
│   ├── profile/
│   │   ├── pages/
│   │   │   └── ProfilePage.tsx          # ✅ EXISTS (103 lines, placeholder)
│   │   └── index.ts                     # ✅ Barrel export
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── MobileNav.tsx            # ⚠️ MODIFY: Add Profile button
│   │   │   ├── DesktopHeader.tsx        # ⚠️ MODIFY: Add Profile link
│   │   │   ├── Breadcrumbs.tsx          # ✅ Used in ProfilePage
│   │   │   └── PageTransition.tsx       # ✅ Used in ProfilePage
│   │   └── hooks/
│   │       └── useNavigation.ts         # ✅ Provides navigate, currentPath
│   │
│   └── settings/                        # Reference for Phase 4.5 patterns
│       ├── pages/SettingsPage.tsx
│       └── components/
│
└── lib/
    └── theme/
        ├── ThemeProvider.tsx            # ✅ Theme context
        └── ThemeToggle.tsx              # ✅ Theme dropdown
```

**Files to Modify**: 2
- `src/features/shared/components/MobileNav.tsx` - Add Profile button
- `src/features/shared/components/DesktopHeader.tsx` - Add Profile link

**Files to Create**: 0 (all components exist)

**Optional**: Install Avatar component (`npx shadcn@latest add avatar`)

---

### Vertical Slice Architecture Analysis

**Important**: This task modifies **shared navigation components** - acceptable cross-cutting concern.

**Existing Feature Slices**:
```yaml
src/features/profile/:          # Profile feature (Phase 4.5)
  - pages/ProfilePage.tsx       # ✅ EXISTS: Placeholder for Phase 5 auth
  - index.ts                    # ✅ EXISTS: Barrel export
  # No changes needed - just needs navigation links

src/features/shared/:           # Shared navigation (cross-cutting)
  - components/MobileNav.tsx    # ⚠️ MODIFY: Add Profile button
  - components/DesktopHeader.tsx # ⚠️ MODIFY: Add Profile link
  - hooks/useNavigation.ts      # ✅ Provides navigation helpers
```

**Feature Boundary Definition**:
- **This Task Modifies**: Shared navigation components (acceptable for new routes)
- **This Task Does NOT Create New Slice**: Profile feature already exists
- **Dependencies**: Profile feature depends on shared navigation for discoverability
- **Slice Isolation**: ✅ Profile is self-contained (no dependencies on other features)

---

### Desired Codebase Tree (After Implementation)

```bash
src/features/shared/components/
├── MobileNav.tsx               # ✅ MODIFIED: Profile button added
└── DesktopHeader.tsx           # ✅ MODIFIED: Profile link added

src/features/profile/
├── pages/
│   └── ProfilePage.tsx         # ✅ UNCHANGED (already complete)
└── index.ts                    # ✅ UNCHANGED

src/components/ui/
└── avatar.tsx                  # ❓ OPTIONAL: Install if desired
```

---

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: MobileNav uses useNavigation hook, NOT useNavigate from react-router-dom
// ❌ DON'T:
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

// ✅ DO:
import { useNavigation } from '../hooks/useNavigation';
const { navigate, currentPath } = useNavigation();

// CRITICAL: DesktopHeader uses NavLink with className function for active state
// ❌ DON'T:
<Link to="/profile" className="...">

// ✅ DO:
<NavLink
  to="/profile"
  className={({ isActive }) => cn(..., isActive && 'bg-accent')}
>

// CRITICAL: TypeScript strict mode requires explicit types
// ❌ DON'T:
const [visible, setVisible] = useState();

// ✅ DO:
const [visible, setVisible] = useState<boolean>(true);

// CRITICAL: Icon sizing pattern
// Mobile: h-5 w-5 (20px)
// Desktop: h-4 w-4 (16px)
// Profile page: h-16 w-16 (64px)

// CRITICAL: Active state differs between mobile and desktop
// Mobile: Manual check with currentPath === '/profile'
// Desktop: Automatic with NavLink's isActive prop

// CRITICAL: ProfilePage already uses SimplePageTransition
// Don't remove or duplicate the transition wrapper

// CRITICAL: Mobile nav auto-hides on scroll down
// New Profile button will inherit this behavior automatically
```

---

## Implementation Blueprint

### Data Models and Structure

**No new data models required** - this is a navigation-only change.

Profile feature already exists with:
- Route: `/profile` (registered in App.tsx line 117)
- Component: `ProfilePage.tsx` (103 lines, complete)
- Export: `index.ts` (barrel export)

---

### Implementation Tasks (Ordered by Completion)

#### Task 1: ADD Profile Button to MobileNav (Mobile Navigation)

**File**: `src/features/shared/components/MobileNav.tsx`

**DECISION**: Choose approach A (recommended) or B

##### Approach A: Replace Back Button with Profile (Recommended)

**Why**:
- Back button is redundant (browser back button works)
- Profile is more useful for Phase 4.5 goals
- Keeps 4-button layout balanced (not crowded)
- Matches Phase 4.5 requirement

**IMPLEMENTATION**:

```typescript
// Step 1: Update imports (line 3)
// BEFORE:
import { Home, ArrowLeft, List, Settings } from 'lucide-react'

// AFTER:
import { Home, User, List, Settings } from 'lucide-react'

// Step 2: Replace Back button with Profile button (lines 71-86)
// FIND (Back button):
<Button
  variant="ghost"
  onClick={goBack}
  aria-label="Go back to previous page"
  className={cn(
    'flex-1 h-12 flex-col gap-1',
    'touch-manipulation',
    'active:scale-95',
    'transition-transform',
    'focus:outline-none focus:ring-2 focus:ring-ring'
  )}
>
  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
  <span className="text-xs">Back</span>
</Button>

// REPLACE WITH (Profile button):
<Button
  variant="ghost"
  onClick={() => navigate('/profile')}
  aria-label="View profile"
  aria-current={currentPath === '/profile' ? 'page' : undefined}
  className={cn(
    'flex-1 h-12 flex-col gap-1',
    'touch-manipulation',
    'active:scale-95',
    'transition-transform',
    'focus:outline-none focus:ring-2 focus:ring-ring',
    currentPath === '/profile' && 'bg-accent text-accent-foreground'
  )}
>
  <User className="h-5 w-5" aria-hidden="true" />
  <span className="text-xs">Profile</span>
</Button>

// Step 3: Leave other buttons unchanged (Home, Sets, Settings)
```

**Navigation Order** (Mobile): `Profile | Home | Sets | Settings`

##### Approach B: Add Profile as 5th Button (Alternative)

**Why**: Keeps Back button, provides both Back and Profile access

**IMPLEMENTATION**:

```typescript
// Step 1: Update imports (line 3)
import { Home, ArrowLeft, User, List, Settings } from 'lucide-react'

// Step 2: Keep all existing buttons (Back, Home, Sets, Settings)

// Step 3: ADD Profile button after Settings (after line 143)
<Button
  variant="ghost"
  onClick={() => navigate('/profile')}
  aria-label="View profile"
  aria-current={currentPath === '/profile' ? 'page' : undefined}
  className={cn(
    'flex-1 h-12 flex-col gap-1',
    'touch-manipulation',
    'active:scale-95',
    'transition-transform',
    'focus:outline-none focus:ring-2 focus:ring-ring',
    currentPath === '/profile' && 'bg-accent text-accent-foreground'
  )}
>
  <User className="h-5 w-5" aria-hidden="true" />
  <span className="text-xs">Profile</span>
</Button>
```

**Navigation Order** (Mobile): `Back | Home | Sets | Settings | Profile`

**FOLLOW pattern**: MobileNav.tsx existing buttons (lines 71-143)
**DEPENDENCIES**: useNavigation hook (line 29), User icon from lucide-react
**PLACEMENT**: Within MobileNav button row (`flex justify-around`)

**VALIDATION**:
```bash
npm run lint                    # Check TypeScript/ESLint
npm run typecheck               # TypeScript strict mode
npm run dev                     # Start dev server
# Manual test: Mobile viewport (< 768px), verify Profile button appears
```

---

#### Task 2: ADD Profile Link to DesktopHeader (Desktop Navigation)

**File**: `src/features/shared/components/DesktopHeader.tsx`

**IMPLEMENTATION**:

```typescript
// Step 1: Update imports (around line 17)
// BEFORE:
import { Home, List, Search, Settings } from 'lucide-react';

// AFTER:
import { Home, List, Search, Settings, User } from 'lucide-react';

// Step 2: Find navigation list (around line 100-130)
// Look for <ul className="flex items-center space-x-6">

// Step 3: ADD Profile link AFTER Setlists, BEFORE Settings
// Position: Between </li> (Setlists) and <li> (Settings)

// INSERT THIS:
<li>
  <NavLink
    to="/profile"
    className={({ isActive }) =>
      cn(
        'inline-flex items-center space-x-2 px-3 py-2 rounded-md',
        'text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isActive && 'bg-accent text-accent-foreground'
      )
    }
    aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
  >
    <User className="h-4 w-4" aria-hidden="true" />
    <span>Profile</span>
  </NavLink>
</li>
```

**Navigation Order** (Desktop): `Search | Setlists | Profile | Settings | [ThemeToggle]`

**FOLLOW pattern**: DesktopHeader.tsx existing nav links (Search, Setlists, Settings)
**DEPENDENCIES**: NavLink from react-router-dom, User icon from lucide-react
**PLACEMENT**: Within `<ul>` navigation list, before Settings `<li>`

**VALIDATION**:
```bash
npm run lint                    # Check TypeScript/ESLint
npm run typecheck               # TypeScript strict mode
npm run dev                     # Start dev server
# Manual test: Desktop viewport (≥ 768px), verify Profile link appears in header
# Test: Click Profile → navigates to /profile
# Test: Verify active state (bg-accent) when on /profile page
```

---

#### Task 3: (OPTIONAL) Install Avatar Component

**Purpose**: Improve ProfilePage UX with proper Avatar component

**Why Optional**: Current ProfilePage uses `<User>` icon in rounded div (works fine). Avatar component provides better semantics and prepares for Phase 5 user images.

**IMPLEMENTATION**:

```bash
# Step 1: Install Avatar component from shadcn/ui
npx shadcn@latest add avatar

# This creates: src/components/ui/avatar.tsx
# Exports: Avatar, AvatarImage, AvatarFallback

# Step 2: Update ProfilePage.tsx to use Avatar (optional)
# File: src/features/profile/pages/ProfilePage.tsx
```

**ProfilePage Avatar Usage** (if installing):

```typescript
// Import Avatar components
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// In ProfilePage.tsx, FIND (lines 41-43):
<div className="rounded-full bg-muted p-6 mb-6">
  <User className="h-16 w-16 text-muted-foreground" />
</div>

// REPLACE WITH:
<Avatar className="h-24 w-24 mb-6">
  <AvatarImage src="" alt="User avatar" />  {/* Empty for Phase 4.5 */}
  <AvatarFallback className="bg-muted">
    <User className="h-12 w-12 text-muted-foreground" />
  </AvatarFallback>
</Avatar>
```

**FOLLOW pattern**: shadcn/ui Avatar documentation
**DEPENDENCIES**: Avatar, AvatarImage, AvatarFallback from @/components/ui/avatar
**PLACEMENT**: ProfilePage.tsx lines 41-43

**VALIDATION**:
```bash
npm run lint                    # Check for import errors
npm run build                   # Verify build succeeds
# Manual test: Visit /profile, verify avatar renders with User icon fallback
```

**Reference**: https://ui.shadcn.com/docs/components/avatar

---

### Implementation Patterns & Key Details

#### Pattern 1: Mobile Navigation Button

```typescript
// Mobile buttons follow this pattern:
<Button
  variant="ghost"                                       // Ghost variant for minimal style
  onClick={() => navigate('/path')}                   // Navigate using hook
  aria-label="Descriptive label"                      // Screen reader text
  aria-current={currentPath === '/path' ? 'page' : undefined}  // Current page indicator
  className={cn(
    'flex-1 h-12 flex-col gap-1',                     // Flex layout, 48px height (WCAG)
    'touch-manipulation',                              // Better touch response
    'active:scale-95',                                 // Scale down on tap
    'transition-transform',                            // Smooth animation
    'focus:outline-none focus:ring-2 focus:ring-ring', // Focus indicator
    currentPath === '/path' && 'bg-accent text-accent-foreground'  // Active state
  )}
>
  <IconComponent className="h-5 w-5" aria-hidden="true" />  // Icon 20px
  <span className="text-xs">Label</span>                     // Text 12px
</Button>
```

#### Pattern 2: Desktop Navigation Link

```typescript
// Desktop links use NavLink for automatic active state:
<li>
  <NavLink
    to="/path"
    className={({ isActive }) =>                      // isActive from NavLink
      cn(
        'inline-flex items-center space-x-2 px-3 py-2 rounded-md',
        'text-sm font-medium transition-colors',      // Text 14px
        'hover:bg-accent hover:text-accent-foreground',  // Hover effect
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isActive && 'bg-accent text-accent-foreground'   // Active state
      )
    }
    aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
  >
    <IconComponent className="h-4 w-4" aria-hidden="true" />  // Icon 16px
    <span>Label</span>
  </NavLink>
</li>
```

#### Pattern 3: Icon Sizing

```typescript
// Mobile navigation icons: 20px (h-5 w-5)
<User className="h-5 w-5" aria-hidden="true" />

// Desktop navigation icons: 16px (h-4 w-4)
<User className="h-4 w-4" aria-hidden="true" />

// Profile page large icon: 64px (h-16 w-16)
<User className="h-16 w-16 text-muted-foreground" />

// Avatar fallback icon: 40px (h-10 w-10)
<User className="h-10 w-10" />
```

#### Pattern 4: Accessibility Attributes

```typescript
// Button accessibility (mobile):
aria-label="View profile"                              // Screen reader description
aria-current={currentPath === '/profile' ? 'page' : undefined}  // Current page
aria-hidden="true"                                     // Hide decorative icons

// NavLink accessibility (desktop):
aria-current={({ isActive }) => (isActive ? 'page' : undefined)}

// Icon hiding from screen readers:
<User className="..." aria-hidden="true" />            // Don't announce icon
```

---

### Integration Points & Cross-Slice Dependencies

**CRITICAL: Modifying shared navigation = acceptable cross-cutting concern**

```yaml
SHARED/COMMON COMPONENTS (Modified):
  - src/features/shared/components/MobileNav.tsx      # Add Profile button
  - src/features/shared/components/DesktopHeader.tsx  # Add Profile link

PROFILE FEATURE (Unchanged):
  - src/features/profile/pages/ProfilePage.tsx        # Already complete
  - src/features/profile/index.ts                     # Already exports ProfilePage

DEPENDENCIES (Existing):
  - lucide-react: User icon
  - react-router-dom: NavLink component
  - @/lib/utils: cn() function
  - src/features/shared/hooks/useNavigation.ts: navigate, currentPath

ROUTING (Unchanged):
  - App.tsx line 117: <Route path="/profile" element={<ProfilePage />} />
  # No routing changes needed - just add navigation links

NO CROSS-SLICE DEPENDENCIES:
  - Profile does NOT depend on Settings
  - Settings does NOT depend on Profile
  - Navigation is shared infrastructure (acceptable to modify)
```

---

## Validation Loop

### Level 1: Syntax & Style (After Each File Edit)

```bash
# After editing MobileNav.tsx or DesktopHeader.tsx:
npm run lint                    # ESLint + TypeScript checks
npm run typecheck               # TypeScript strict mode validation

# Expected: Zero errors
# If errors exist:
# - Missing imports? Add User icon from lucide-react
# - Type errors? Check className function in NavLink
# - ESLint errors? Follow suggested fixes (usually formatting)
```

### Level 2: Development Server (Visual Validation)

```bash
# Start development server
npm run dev

# Test Mobile Navigation (< 768px):
# 1. Open DevTools → Responsive Design Mode → iPhone SE (375x667)
# 2. Verify Profile button appears in bottom bar
# 3. Tap Profile button → navigates to /profile
# 4. Verify active state (bg-accent background when on /profile)
# 5. Verify icon (User) and label ("Profile") visible
# 6. Verify 48px touch target (h-12 = 48px)
# 7. Tap other pages → Profile active state should disappear

# Test Desktop Navigation (≥ 768px):
# 1. Resize viewport to 1280x720 or larger
# 2. Verify Profile link appears in top header between Setlists and Settings
# 3. Click Profile link → navigates to /profile
# 4. Verify active state (bg-accent background when on /profile)
# 5. Hover over Profile link → verify hover effect (bg-accent)
# 6. Verify icon (User) and label ("Profile") visible
# 7. Navigate to other pages → Profile active state should disappear

# Test ProfilePage:
# 1. Navigate to /profile via mobile or desktop nav
# 2. Verify breadcrumbs display: Home → Profile
# 3. Verify page header: "Profile"
# 4. Verify placeholder content: User icon, "Welcome to HSA Songbook"
# 5. Verify "Sign In" button is disabled with "(Coming in Phase 5)" text
# 6. Click "Settings" link → navigates to /settings
# 7. Check browser console → should be ZERO errors

# Test Responsive Breakpoint:
# 1. Start at mobile (375px)
# 2. Slowly resize to desktop (1280px)
# 3. At 768px: Mobile nav should hide, desktop nav should appear
# 4. Profile button/link should be visible in both layouts
# 5. No layout shifts or visual glitches

# Expected: All navigation works, zero console errors, active states correct
```

### Level 3: Production Build (Integration Validation)

```bash
# Build for production
npm run build

# Expected output:
# ✓ built in XXXms
# ✓ 0 TypeScript errors
# ✓ 0 build warnings

# Preview production build
npm run preview

# Test same scenarios as Level 2:
# - Mobile navigation (Profile button)
# - Desktop navigation (Profile link)
# - ProfilePage loads
# - Active states work
# - No console errors

# Check PWA service worker:
# Open DevTools → Application → Service Workers
# Verify service worker is running
# Navigate to /profile → page should cache correctly
# Go offline (DevTools → Network → Offline)
# Navigate to /profile → page should still load

# Expected: Production build works identically to dev server
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Accessibility Testing (Keyboard Navigation):
# 1. Close mouse/trackpad (keyboard only)
# 2. Press Tab repeatedly
# 3. Verify Profile button/link receives focus ring
# 4. Press Enter on Profile → navigates to /profile
# 5. Verify focus ring visible (focus:ring-2 class)
# 6. Press Tab on /profile page → breadcrumbs, buttons should be focusable

# Screen Reader Testing (Optional - if available):
# 1. Enable VoiceOver (Mac: Cmd+F5) or NVDA (Windows)
# 2. Navigate to Profile button/link
# 3. Verify announces "View profile" or "Profile, link"
# 4. Verify icon is NOT announced (aria-hidden="true")
# 5. When on /profile page, verify announces "Profile, current page"

# Mobile Touch Testing (Real Device Recommended):
# 1. Open on real mobile device or browser touch emulation
# 2. Tap Profile button → verify responsive tap feedback
# 3. Verify active:scale-95 animation (button scales down on tap)
# 4. Verify no double-tap delay (touch-manipulation class)
# 5. Verify 48px touch target feels comfortable (not too small)

# Dark Mode Testing:
# 1. Click ThemeToggle in header → switch to Dark mode
# 2. Verify Profile button/link visible in dark mode
# 3. Verify active state (bg-accent) visible in dark mode
# 4. Navigate to /profile → verify page content readable in dark mode
# 5. Verify User icon visible (not too dark)
# 6. Switch back to Light mode → verify everything still works

# Navigation Consistency Testing:
# 1. Type /profile directly in URL bar → press Enter
# 2. Verify Profile button/link shows active state
# 3. Navigate to /settings → verify Profile active state disappears
# 4. Use browser back button → verify Profile active state reappears
# 5. Use browser forward button → verify active states update correctly

# Scroll Behavior Testing (Mobile):
# 1. On mobile viewport, scroll down on home page
# 2. Verify mobile nav auto-hides (translate-y-full)
# 3. Scroll up → verify mobile nav reappears
# 4. Profile button should inherit auto-hide behavior

# Multi-Device Testing:
# 1. Test on Chrome (desktop + mobile)
# 2. Test on Firefox (desktop + mobile)
# 3. Test on Safari (desktop + mobile if available)
# 4. Verify no browser-specific rendering issues
# 5. Verify active states work consistently across browsers

# Expected: All accessibility, dark mode, multi-device tests pass
```

---

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Production build succeeds: `npm run build`
- [ ] Preview build works: `npm run preview`
- [ ] Service worker caches /profile page correctly

### Feature Validation

- [ ] Profile button appears in MobileNav (< 768px)
- [ ] Profile link appears in DesktopHeader (≥ 768px)
- [ ] Clicking Profile navigates to `/profile` page
- [ ] Active state works (bg-accent when on /profile)
- [ ] ProfilePage loads without console errors
- [ ] Breadcrumbs work (Home → Profile)
- [ ] "Settings" link on ProfilePage works
- [ ] User icon renders correctly (lucide-react)
- [ ] ARIA labels present (aria-label, aria-current)
- [ ] Touch targets are 48px (mobile h-12 class)
- [ ] Optional: Avatar component installed and working

### Code Quality Validation

- [ ] Follows existing MobileNav/DesktopHeader patterns
- [ ] TypeScript strict mode compliance (no `any` types)
- [ ] Icon sizing follows pattern (h-5 w-5 mobile, h-4 w-4 desktop)
- [ ] Active state logic matches existing buttons/links
- [ ] Accessibility attributes added correctly
- [ ] No cross-slice dependencies (Profile is independent)
- [ ] File placement correct (modifications in shared/components)

### User Experience Validation

- [ ] Navigation is discoverable (no orphaned pages)
- [ ] Mobile bottom bar not overcrowded (4 buttons recommended)
- [ ] Desktop header navigation logically ordered
- [ ] Profile page placeholder communicates Phase 5 benefits
- [ ] Dark mode works correctly
- [ ] Responsive breakpoints work (768px transition smooth)
- [ ] Browser back/forward buttons work
- [ ] Keyboard navigation works (Tab, Enter, Escape)

---

## Anti-Patterns to Avoid

### General Anti-Patterns

- ❌ Don't use `any` types - TypeScript strict mode enforced
- ❌ Don't use `useNavigate` from react-router-dom in MobileNav - use `useNavigation` hook
- ❌ Don't use `<Link>` for navigation - use `<NavLink>` for automatic active state
- ❌ Don't forget ARIA labels - accessibility is critical
- ❌ Don't skip manual testing - visual issues won't be caught by lint

### Navigation-Specific Anti-Patterns

- ❌ Don't create 6+ buttons in mobile nav - too crowded (max 5)
- ❌ Don't forget active state styling - users need visual feedback
- ❌ Don't use inconsistent icon sizes - follow pattern strictly
- ❌ Don't skip touch target sizing - WCAG requires 48px minimum
- ❌ Don't nest buttons (e.g., NavLink > Button) - HTML validation error

### Profile Page Anti-Patterns

- ❌ Don't remove SimplePageTransition wrapper - needed for UX consistency
- ❌ Don't add authentication logic - Phase 4.5 is placeholder only
- ❌ Don't create complex state management - keep simple for placeholder
- ❌ Don't skip @future JSDoc comments - document Phase 5 plans

### Vertical Slice Anti-Patterns

- ❌ Don't create dependencies from Profile to Settings - independent slices
- ❌ Don't put profile logic in shared/ - shared is for navigation only
- ❌ Don't bypass barrel exports (index.ts) - use public API
- ❌ Don't create circular dependencies between slices

---

## PRP Quality Self-Assessment

### Scoring Criteria (1-10)

**Context Completeness**: 10/10
- ✅ All necessary files identified with exact paths
- ✅ Existing patterns documented with code examples
- ✅ External documentation linked (shadcn/ui, WCAG)
- ✅ Known gotchas explicitly listed
- ✅ Agent has all info needed for one-pass implementation

**Validation Gates Executable**: 10/10
- ✅ All commands executable by AI agent
- ✅ 4 validation levels with specific test scenarios
- ✅ Manual testing steps are detailed and actionable
- ✅ Expected outcomes clearly defined
- ✅ Creative domain-specific tests included

**Vertical Slice Clarity**: 10/10
- ✅ Feature boundaries explicitly identified
- ✅ Cross-slice dependencies documented (navigation is shared)
- ✅ Minimal coupling (just navigation links)
- ✅ Profile slice remains independent

**Implementation Blueprint**: 10/10
- ✅ Tasks ordered by completion priority
- ✅ Specific line numbers and code examples provided
- ✅ Pattern references from existing codebase
- ✅ Two approaches documented (replace Back vs add 5th button)
- ✅ Optional tasks clearly marked

**Error Handling Documentation**: 9/10
- ✅ Known gotchas documented
- ✅ TypeScript patterns shown
- ✅ Anti-patterns listed
- ⚠️ Could add more edge cases (network errors, etc.) - but minimal for navigation task

**Overall Confidence Score**: **9.8/10**

**Reason for High Score**:
- All research completed and incorporated
- Existing codebase patterns thoroughly analyzed
- Code examples are copy-paste ready
- Validation steps are comprehensive and executable
- Agent can implement in one pass with high success probability

**Potential Improvement**:
- Could add integration tests (Vitest) - but not available yet
- Could add Lighthouse performance audit - but overkill for nav links

---

## Estimated Effort Breakdown

**Minimum Implementation** (Approach A - Replace Back button):
- Task 1: Add Profile to MobileNav - **30 minutes**
- Task 2: Add Profile to DesktopHeader - **20 minutes**
- Testing & Validation (Levels 1-2) - **30 minutes**
- **Total: 1.5 hours**

**Full Implementation** (Approach A + Avatar + Enhanced Testing):
- Task 1: Add Profile to MobileNav - **30 minutes**
- Task 2: Add Profile to DesktopHeader - **20 minutes**
- Task 3: Install Avatar component - **15 minutes**
- Testing & Validation (Levels 1-4) - **45 minutes**
- Cross-browser testing - **20 minutes**
- Documentation updates - **10 minutes**
- **Total: 2.5 hours**

**Alternative Implementation** (Approach B - Add 5th button):
- Similar timeline, +10 minutes for testing crowded layout
- **Total: 1.5-2.5 hours**

---

## Conclusion

This BASE PRP provides a complete, implementation-ready blueprint for integrating Profile navigation into the HSA Songbook app. The task is straightforward (modifying 2 files), follows established patterns, and maintains TypeScript strict mode compliance.

**Recommended Approach**: Start with **Minimum Implementation** (Approach A - replace Back button) to quickly complete Phase 4.5 requirements. The optional Avatar component can be added later if desired.

**Next Steps After Implementation**:
1. Complete all 4 validation levels
2. Complete Final Validation Checklist
3. Commit changes with descriptive message
4. Move to next Phase 4.5 task (Enhanced Search/Homepage, Keyboard Shortcuts, etc.)

**Phase 5 Preparation**: This implementation establishes the navigation foundation. In Phase 5, the Profile page will be enhanced with real user data, authentication, and avatar upload functionality.

**Related Documentation**:
- Comprehensive planning document: `PRPs/phase4.5-prp5-profile-navigation-ux-planning.md`
- CLAUDE.md Phase 4.5 requirements (lines 46-51)
- Existing ProfilePage: `src/features/profile/pages/ProfilePage.tsx`
