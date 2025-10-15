name: "Phase 5 Authentication Flow - BASE PRP"
description: |
  Comprehensive implementation guide for Supabase authentication with anonymous sign-in,
  offline token handling, and progressive user conversion for HSA Songbook PWA.

---

## Goal

**Feature Goal**: Implement authentication system that preserves offline-first experience while enabling cloud sync and multi-device access.

**Deliverable**:
- Functional `AuthProvider` with anonymous and email/password authentication
- Session persistence with offline token handling (14-day offline window)
- UI components for sign-in/sign-up (desktop modal + mobile page)
- User state display across all navigation components
- Data migration system (local → cloud on first sign-in)

**Success Definition**:
- ✅ User can use app fully offline without sign-in (anonymous mode)
- ✅ Anonymous user can convert to authenticated (zero data loss, same user ID)
- ✅ Token refresh works automatically (foreground + offline fallback)
- ✅ Multi-device sync works (sign in on Device A + B, see same data)
- ✅ All validation gates pass (typecheck, lint, build, manual testing)

## User Persona

**Target User**: Worship leader (primary) and church musicians (secondary)

**Use Case**:
- Discover app, try it immediately without sign-up
- Create custom arrangements offline during rehearsal
- Later decide to sign up to sync across phone + laptop
- Edit same arrangement on phone during practice, laptop at home

**User Journey**:
1. Open app → Automatically signed in anonymously → Browse songs
2. Edit arrangement offline → Saves to IndexedDB
3. See "Sign in to sync" banner → Click "Create Account"
4. Enter email/password → Convert anonymous → authenticated (same user ID)
5. Local data uploads to Supabase → "Your data is now synced!"
6. Sign in on laptop → Pull cloud data → Edit arrangement
7. Token refreshes automatically every hour → No interruption

**Pain Points Addressed**:
- **Friction on first launch**: No sign-up required, instant access
- **Data loss fear**: Anonymous conversion preserves all local data
- **Multi-device fragmentation**: Cloud sync keeps devices in sync
- **Token expiry interruptions**: Automatic refresh, offline grace period

## Why

- **Preserves Phase 1-4 offline-first UX**: Zero regressions, same instant-access experience
- **Enables Phase 5+ cloud features**: Multi-device sync, collaboration, community library
- **Minimizes auth friction**: Anonymous mode removes barriers to adoption
- **Handles worship team reality**: Church WiFi is unreliable, offline editing is common
- **Prepares for social features**: User accounts enable ratings, favorites, sharing (Phase 6+)

## What

**User-Visible Behavior**:

1. **Anonymous Mode (Default)**:
   - App launches → User is automatically signed in anonymously
   - Full access to all features (browse, edit, create setlists)
   - Data persists in IndexedDB
   - Optional dismissible banner: "Sign in to sync your data"

2. **Sign-In Flow**:
   - Desktop: Modal overlay with sign-in form
   - Mobile: Dedicated `/auth/signin` page
   - Toggle between "Sign In" and "Sign Up" modes
   - Email/password only (OAuth deferred to Phase 5.1+)

3. **Anonymous → Authenticated Conversion**:
   - User enters email + password in sign-up form
   - `supabase.auth.updateUser()` converts anonymous → authenticated
   - User ID preserved (no new account created)
   - Local IndexedDB data uploads to Supabase
   - Progress indicator: "Syncing your data... (50/100 items)"
   - Success message: "Your data is now synced! 🎉"

4. **Token Refresh (Automatic)**:
   - Supabase auto-refresh every hour (background)
   - If refresh fails (offline): Keep user logged in locally
   - When back online: Retry refresh automatically
   - Offline window: 14 days max before forced re-auth

5. **User State Display**:
   - Desktop header: "Sign In" button (anonymous) or user avatar dropdown (authenticated)
   - Mobile nav: "Profile" tab shows "Sign In" (anonymous) or user initials (authenticated)
   - Profile page: "Create Account" CTA (anonymous) or profile details (authenticated)
   - Settings → Account section: Sign-in status and sync controls

**Technical Requirements**:
- Install `@supabase/supabase-js` SDK
- Create Supabase project with anonymous auth enabled
- IndexedDB schema update: Add `sessions` and `preferences` stores (version bump 6 → 7)
- Type definitions: Update Song, Arrangement, Setlist with `userId` and `isPublic` fields
- Row Level Security (RLS) policies in Supabase PostgreSQL

### Success Criteria

- [ ] Anonymous user can browse/edit without sign-in prompt
- [ ] User can create account via email/password
- [ ] Anonymous → authenticated conversion preserves user ID
- [ ] Local data uploads to Supabase on first sign-in (songs, arrangements, setlists)
- [ ] Token refresh happens automatically (no user-visible interruption)
- [ ] User stays logged in during 14-day offline period
- [ ] Multi-device sign-in works (same data on phone + laptop)
- [ ] Sign-out clears session but preserves local data (for anonymous re-use)
- [ ] All UI locations show correct auth state (header, nav, profile, settings)
- [ ] RLS policies prevent unauthorized data access

## All Needed Context

### Context Completeness Check

_✅ Validated: This PRP provides everything needed to implement authentication successfully without prior codebase knowledge._

### Documentation & References

```yaml
# MUST READ - Supabase Authentication
- url: https://supabase.com/docs/guides/auth/auth-anonymous#getting-started
  why: Core implementation pattern for signInAnonymously() and anonymous user conversion
  critical: User ID preservation during conversion - updateUser() keeps same ID, preventing data migration issues

- url: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
  why: Event-driven token refresh pattern (replaces manual polling)
  critical: TOKEN_REFRESHED event triggers sync queue processing

- url: https://supabase.com/docs/guides/auth/sessions#automatic-session-refresh
  why: Understanding automatic token refresh behavior and failure handling
  critical: Offline refresh failures should NOT sign user out - retry when online

- file: PRPs/research/token_refresh_strategies_offline_pwa.md
  why: Comprehensive offline token handling strategy with code examples
  pattern: Section 4 - Recommended Implementation (lines 364-683)
  gotcha: localStorage is vulnerable to XSS - mitigate with CSP headers

- file: PRPs/ai_docs/codebase-auth-analysis.md
  why: Detailed analysis of existing patterns to follow (ThemeProvider, BaseRepository, hooks)
  pattern: Section 2.1 - Context Provider Pattern (lines 92-167)
  gotcha: Must extend BaseRepository with permission checks, not replace it

- file: PRPs/ai_docs/offline-sync-patterns.md
  why: Sync queue implementation for queuing offline operations
  pattern: Section "Sync Queue Implementation" (lines 212-318)
  gotcha: Process queue after TOKEN_REFRESHED event, not on every online event

# MUST READ - React Patterns
- url: https://react.dev/reference/react/useContext#usage
  why: React Context API best practices for AuthProvider implementation
  critical: Avoid unnecessary re-renders by splitting user state and auth actions into separate contexts

- file: src/lib/theme/ThemeProvider.tsx (lines 1-167)
  why: EXACT pattern to follow for AuthProvider (context + provider + hook)
  pattern: ThemeProvider structure → AuthProvider structure (same file organization)
  gotcha: Must use localStorage for persistence (IndexedDB is async, context init is sync)

- file: src/features/pwa/hooks/useOnlineStatus.ts (lines 1-36)
  why: Existing online/offline detection pattern to reuse
  pattern: Use this hook in useAuth() for token refresh logic
  gotcha: navigator.onLine is unreliable - must verify with actual network request

# MUST READ - Database Integration
- file: src/features/pwa/db/repository.ts (lines 17-357)
  why: Generic repository pattern to extend with user filtering
  pattern: BaseRepository<T extends BaseEntity> - add user_id filtering to getAll()
  gotcha: Do NOT modify BaseRepository directly - extend it with SupabaseRepository<T>

- file: src/types/Database.types.ts (lines 1-151)
  why: IndexedDB schema to extend with auth stores
  pattern: HSASongbookDB interface - add 'sessions' and 'preferences' stores
  gotcha: Must bump database version from 6 to 7 to trigger migration

- file: src/features/pwa/db/database.ts (lines 1-180)
  why: Database initialization pattern with version migrations
  pattern: onupgradeneeded event handler - add auth stores here
  gotcha: Migrations are irreversible - test thoroughly before deploying
```

### Current Codebase Tree

```bash
src/
├── app/
│   ├── App.tsx                      # Main routing + ErrorBoundary + ThemeProvider
│   └── main.tsx                     # Application entry point
├── components/ui/                    # shadcn/ui primitives
│   ├── button.jsx                   # Button component (will need for auth forms)
│   ├── card.jsx                     # Card component (for auth modals)
│   ├── dropdown-menu.jsx            # Dropdown menu (for user avatar dropdown)
│   ├── input.jsx                    # Input component (for email/password fields)
│   ├── label.jsx                    # Label component (for form fields)
│   └── dialog.jsx                   # Dialog component (for sign-in modal)
├── features/
│   ├── arrangements/                # Arrangement viewing/editing
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   ├── chordpro/                    # ChordPro editor/viewer
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   ├── pwa/                         # PWA features (CRITICAL for auth integration)
│   │   ├── components/
│   │   │   ├── OfflineIndicator.tsx # Update with auth state
│   │   │   └── UpdateNotification.tsx
│   │   ├── db/
│   │   │   ├── database.ts          # IndexedDB setup - ADD auth stores here
│   │   │   ├── repository.ts        # Generic repository - EXTEND for user filtering
│   │   │   └── dataMigration.ts
│   │   └── hooks/
│   │       ├── useOnlineStatus.ts   # Online/offline detection - REUSE for token refresh
│   │       └── usePWA.ts
│   ├── profile/                     # Profile page (NEEDS auth integration)
│   │   └── pages/
│   │       └── ProfilePage.tsx      # UPDATE with authenticated state
│   ├── search/                      # Search functionality
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   ├── setlists/                    # Setlist management
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   ├── settings/                    # Settings page (NEEDS auth integration)
│   │   ├── components/
│   │   │   └── AccountSection.tsx   # UPDATE with sign-in/sign-out
│   │   └── pages/
│   ├── shared/                      # Shared components (NEEDS auth integration)
│   │   ├── components/
│   │   │   ├── DesktopHeader.tsx    # UPDATE with user dropdown
│   │   │   └── MobileNav.tsx        # UPDATE with profile indicator
│   │   └── hooks/
│   └── songs/                       # Song CRUD operations
│       ├── components/
│       ├── hooks/
│       └── pages/
├── lib/
│   ├── config/                      # Centralized configuration
│   ├── theme/
│   │   └── ThemeProvider.tsx        # PATTERN TO FOLLOW for AuthProvider
│   ├── logger.ts                    # Production-safe logging
│   └── utils.ts                     # Tailwind merge utilities
└── types/                           # Global TypeScript type definitions
    ├── Song.types.ts                # UPDATE with userId + isPublic
    ├── Arrangement.types.ts         # UPDATE with userId + isPublic
    ├── Setlist.types.ts             # UPDATE with userId
    └── Database.types.ts            # UPDATE with sessions + preferences stores
```

### Desired Codebase Tree (Files to Add)

```bash
src/
├── features/
│   └── auth/                        # NEW FEATURE MODULE
│       ├── components/
│       │   ├── SignInModal.tsx      # Desktop modal for sign-in/sign-up
│       │   ├── SignInForm.tsx       # Shared sign-in form (email/password)
│       │   ├── SignUpForm.tsx       # Shared sign-up form (email/password + confirm)
│       │   ├── SignInBanner.tsx     # Dismissible banner ("Sign in to sync")
│       │   ├── UserDropdown.tsx     # User avatar + dropdown menu (Profile, Settings, Sign Out)
│       │   └── AuthGuard.tsx        # HOC for protecting routes (future Phase 5.1+)
│       ├── context/
│       │   ├── AuthProvider.tsx     # React Context provider for auth state
│       │   └── AuthContext.tsx      # Context definition + types
│       ├── hooks/
│       │   ├── useAuth.ts           # Main auth hook (useContext wrapper)
│       │   ├── useAuthSync.ts       # Hook for syncing local data to Supabase
│       │   ├── useSession.ts        # Hook for session management (refresh, expiry)
│       │   └── useAnonymousConversion.ts # Hook for converting anonymous → authenticated
│       ├── pages/
│       │   ├── SignInPage.tsx       # Mobile dedicated sign-in page (/auth/signin)
│       │   └── SignUpPage.tsx       # Mobile dedicated sign-up page (/auth/signup)
│       ├── services/
│       │   ├── authService.ts       # Supabase auth operations (signIn, signUp, signOut)
│       │   └── dataMigrationService.ts # Upload local data to Supabase on first sign-in
│       ├── types/
│       │   ├── auth.types.ts        # Auth-specific types (User, Session, AuthState)
│       │   └── index.ts             # Barrel export
│       └── utils/
│           ├── tokenRefresh.ts      # Offline token refresh logic
│           └── sessionPersistence.ts # localStorage session management
├── lib/
│   └── supabase.ts                  # NEW: Supabase client setup + onAuthStateChange listener
└── types/
    └── User.types.ts                # NEW: User type definition (extends Supabase user)

# Files to MODIFY (not create):
src/app/App.tsx                      # Wrap with AuthProvider
src/features/shared/components/DesktopHeader.tsx  # Add user dropdown
src/features/shared/components/MobileNav.tsx      # Add profile indicator
src/features/profile/pages/ProfilePage.tsx        # Add auth state
src/features/settings/components/AccountSection.tsx # Add sign-in/sign-out
src/features/pwa/db/database.ts                   # Add sessions + preferences stores
src/types/Song.types.ts                           # Add userId + isPublic fields
src/types/Arrangement.types.ts                    # Add userId + isPublic fields
src/types/Setlist.types.ts                        # Add userId field
src/types/Database.types.ts                       # Add sessions + preferences stores
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Supabase Anonymous Auth Configuration
// GOTCHA: Must enable anonymous sign-ins in Supabase dashboard
// Dashboard → Project Settings → Authentication → User Signups → Enable "Allow anonymous sign-ins"
// Also enable CAPTCHA to prevent abuse (hCaptcha or Cloudflare Turnstile)

// GOTCHA: updateUser() for conversion MUST be called while anonymous session is active
// If user signs out before calling updateUser(), it will fail (session required)
// CORRECT PATTERN:
const { data, error } = await supabase.auth.updateUser({
  email: 'user@example.com',
  password: 'securepassword'
});
// User ID stays the same! No data migration needed

// INCORRECT PATTERN (creates new user):
await supabase.auth.signOut();  // ❌ Signs out anonymous user
await supabase.auth.signUp({    // ❌ Creates NEW user with NEW ID
  email: 'user@example.com',
  password: 'securepassword'
});

// CRITICAL: Token Storage Security
// GOTCHA: localStorage is vulnerable to XSS attacks
// MITIGATION: Add Content Security Policy (CSP) headers to prevent script injection
// Add to index.html <meta> tag:
// <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self';">

// GOTCHA: Supabase autoRefreshToken uses setInterval in background
// This can cause issues in mobile browsers when tab is backgrounded
// SOLUTION: Supabase automatically pauses refresh when tab is not visible (no action needed)

// CRITICAL: Offline Token Refresh
// GOTCHA: Token refresh fails when offline → Supabase emits SIGNED_OUT event
// DO NOT sign user out during offline refresh failures!
// CORRECT PATTERN:
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && !navigator.onLine) {
    // Keep user logged in locally during offline period
    console.log('Offline - keeping user authenticated locally');
    return; // Do NOT redirect to login
  }
});

// GOTCHA: navigator.onLine is unreliable (can be true but no internet)
// SOLUTION: Verify with actual network request (see PRPs/research/token_refresh_strategies_offline_pwa.md:195-212)

// CRITICAL: IndexedDB Schema Migration
// GOTCHA: onupgradeneeded only fires when database version number increases
// MUST bump version from 6 to 7 in src/features/pwa/db/database.ts
// OLD: const db = await openDB<HSASongbookDB>('hsa-songbook-db', 6, { ... })
// NEW: const db = await openDB<HSASongbookDB>('hsa-songbook-db', 7, { ... })

// GOTCHA: Migrations are irreversible - cannot downgrade database version
// SOLUTION: Test migrations thoroughly in development before deploying

// CRITICAL: Row Level Security (RLS)
// GOTCHA: Anonymous users have auth.uid() that changes on every session
// SOLUTION: Track anonymous user ID in IndexedDB, sync to Supabase on conversion
// RLS Policy Pattern:
// CREATE POLICY "Users can view own or public arrangements"
//   ON arrangements FOR SELECT
//   USING (auth.uid() = user_id OR is_public = true);

// GOTCHA: RLS policies apply to anon key requests (even without authentication)
// SOLUTION: Use anon key for client, never expose service_role key

// CRITICAL: React Context Performance
// GOTCHA: Updating auth context re-renders ALL consumers
// SOLUTION: Split user state and auth actions into separate contexts
// See: https://react.dev/reference/react/useContext#optimizing-re-renders-when-passing-objects-and-functions

// Example:
// AuthStateContext - user, loading, error (frequently read, rarely changes)
// AuthActionsContext - signIn, signOut, signUp (rarely read, never changes)
// This prevents re-renders when user object updates

// GOTCHA: ThemeProvider uses localStorage (sync), not IndexedDB (async)
// SOLUTION: Auth session must ALSO use localStorage for immediate access on app startup
// IndexedDB is too slow for context initialization (async operations)

// CRITICAL: Service Worker Cache Interference
// GOTCHA: Service worker may cache Supabase API responses (breaks token refresh)
// SOLUTION: Add cache bypass for auth endpoints in vite.config.ts
// navigateFallbackDenylist: [/^\/api/, /supabase\.co/]
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// ========================================
// File: src/types/User.types.ts (NEW FILE)
// ========================================
/**
 * User type definition (extends Supabase user)
 * Represents authenticated or anonymous user
 */
export interface User {
  id: string;                          // UUID from Supabase Auth
  email?: string;                      // Email (only for authenticated users)
  isAnonymous: boolean;                // True for anonymous users
  createdAt: string;                   // ISO timestamp
  lastSignInAt?: string;               // ISO timestamp (last sign-in time)
}

/**
 * Auth session type (mirrors Supabase session)
 */
export interface AuthSession {
  accessToken: string;                 // JWT access token (1 hour expiry)
  refreshToken: string;                // Refresh token (30 days expiry)
  expiresAt: number;                   // Unix timestamp (access token expiry)
  expiresIn: number;                   // Seconds until expiry
  user: User;
}

/**
 * Auth state for React Context
 */
export interface AuthState {
  user: User | null;                   // Current user (null = not initialized)
  session: AuthSession | null;         // Current session
  loading: boolean;                    // Loading state (true during initialization)
  error: Error | null;                 // Auth error (sign-in failures, etc.)
  isOnline: boolean;                   // Network status
  offlineDays: number;                 // Days since last token refresh
}

/**
 * Auth actions for React Context
 */
export interface AuthActions {
  signInAnonymously: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  convertToAuthenticated: (email: string, password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ========================================
// File: src/types/Database.types.ts (UPDATE)
// ========================================
import { DBSchema } from 'idb';
import { Song } from './Song.types';
import { Arrangement } from './Arrangement.types';
import { Setlist } from './Setlist.types';

/**
 * IndexedDB schema for HSA Songbook
 * Version 7 - Added auth support (sessions, preferences)
 */
export interface HSASongbookDB extends DBSchema {
  // Existing stores (no changes to structure)
  songs: { key: string; value: Song };
  arrangements: { key: string; value: Arrangement };
  setlists: { key: string; value: Setlist };
  drafts: { key: string; value: Draft };

  // NEW: Auth session storage (for offline persistence)
  sessions: {
    key: 'current';                    // Single session (always key = 'current')
    value: {
      userId: string;                  // UUID from Supabase Auth
      isAnonymous: boolean;            // True for anonymous users
      email?: string;                  // Email (only for authenticated)
      accessToken: string;             // JWT access token
      refreshToken: string;            // Refresh token
      expiresAt: number;               // Unix timestamp (access token expiry)
      lastRefreshedAt: number;         // Unix timestamp (last refresh time)
    };
  };

  // NEW: User preferences (settings, theme, sync options)
  preferences: {
    key: string;                       // userId
    value: {
      userId: string;                  // Owner of these preferences
      theme: 'light' | 'dark' | 'system'; // Theme preference (already in ThemeContext, but store here for cloud sync)
      defaultKey: string;              // Default musical key for new arrangements
      autoSync: boolean;               // Enable automatic sync when online
      syncOnMobileData: boolean;       // Sync even on cellular data (default: false)
    };
  };

  // Future: sync_queue store (Phase 5.2 - conflict resolution)
  // sync_queue: {
  //   key: string;                     // Operation ID
  //   value: SyncQueueItem;
  // };
}

// ========================================
// File: src/types/Song.types.ts (UPDATE)
// ========================================
/**
 * Song domain model types
 * UPDATED for Phase 5: Added userId and isPublic fields
 */
export interface Song {
  id: string;
  slug: string;
  title: string;
  artist: string;
  themes?: string[];
  copyright?: string;
  lyrics?: {
    en?: string;
    [language: string]: string | undefined;
  };

  // NEW FIELDS (Phase 5 - Authentication)
  userId?: string;                     // Creator user ID (optional for backward compatibility)
  isPublic?: boolean;                  // Public vs private (default: true for songs)

  // Future fields for Phase 5+
  compositionYear?: number;
  source?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// File: src/types/Arrangement.types.ts (UPDATE)
// ========================================
/**
 * Arrangement domain model types
 * UPDATED for Phase 5: Added userId and isPublic fields
 */
export interface Arrangement {
  id: string;
  slug: string;
  songId: string;
  name: string;
  key: string;
  tempo: number;
  timeSignature: string;
  capo: number;
  tags: string[];
  rating: number;
  favorites: number;
  chordProContent: string;
  createdAt: string;
  updatedAt: string;

  // NEW FIELDS (Phase 5 - Authentication)
  userId?: string;                     // Creator user ID (optional for backward compatibility)
  isPublic?: boolean;                  // Public vs private (default: true for arrangements)

  // Future fields for Phase 5+ (sync support)
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
  lastAccessedAt?: number;
}

// ========================================
// File: src/types/Setlist.types.ts (UPDATE)
// ========================================
/**
 * Setlist domain model types
 * UPDATED for Phase 5: Added userId (setlists are always private)
 */
export interface Setlist {
  id: string;
  name: string;
  description?: string;
  performanceDate?: string;
  songs: SetlistSong[];
  createdAt: string;
  updatedAt: string;

  // NEW FIELDS (Phase 5 - Authentication)
  userId?: string;                     // Owner user ID (optional for backward compatibility)
  // Note: Setlists are always private (no isPublic field)

  // Future fields for Phase 5+ (sharing)
  shareId?: string;                    // Unique ID for sharing (Phase 5.1+)
  isShared?: boolean;                  // Shared via public link (Phase 5.1+)
}

// ========================================
// Zod Validation Schemas (for form validation)
// ========================================
import { z } from 'zod';

/**
 * File: src/features/auth/validation/authSchemas.ts (NEW FILE)
 */

// Email validation schema
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

// Password validation schema (Supabase default: min 6 characters)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter');

// Sign-in form schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'), // Don't validate complexity on sign-in
});

export type SignInFormData = z.infer<typeof signInSchema>;

// Sign-up form schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
```

### Implementation Tasks (Ordered by Dependencies)

```yaml
# ========================================
# WEEK 1: FOUNDATION (Days 1-5)
# ========================================

Task 1: CREATE src/lib/supabase.ts
  - IMPLEMENT: Supabase client setup with autoRefreshToken and localStorage storage
  - FOLLOW pattern: PRPs/research/token_refresh_strategies_offline_pwa.md (lines 421-483)
  - NAMING: Export as `supabase` (singleton client)
  - PLACEMENT: src/lib/ (core utilities)
  - DEPENDENCIES: None (first task)
  - VALIDATION: Can import and call supabase.auth.signInAnonymously() in dev console

Task 2: CREATE Supabase project and database
  - IMPLEMENT: Sign up for Supabase, create new project, enable anonymous auth
  - FOLLOW pattern: PRPs/phase5-authentication-flow-prd.md Appendix C (lines 1591-1621)
  - CRITICAL: Enable "Allow anonymous sign-ins" in Dashboard → Authentication → User Signups
  - DEPENDENCIES: Task 1 (need client setup first)
  - VALIDATION: Can sign in anonymously via Supabase dashboard

Task 3: CREATE .env.local with Supabase credentials
  - IMPLEMENT: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  - FOLLOW pattern: PRPs/phase5-authentication-flow-prd.md Appendix D (lines 1627-1631)
  - CRITICAL: Never commit .env.local (already in .gitignore)
  - DEPENDENCIES: Task 2 (need Supabase project credentials)
  - VALIDATION: `echo $VITE_SUPABASE_URL` shows correct URL

Task 4: CREATE src/types/User.types.ts
  - IMPLEMENT: User, AuthSession, AuthState, AuthActions interfaces
  - FOLLOW pattern: Data Models section above (lines 147-197)
  - NAMING: PascalCase for interfaces (User, AuthSession, etc.)
  - DEPENDENCIES: None
  - VALIDATION: `npm run typecheck` passes

Task 5: UPDATE src/types/Database.types.ts
  - IMPLEMENT: Add sessions and preferences stores to HSASongbookDB
  - FOLLOW pattern: Data Models section above (lines 199-258)
  - CRITICAL: Bump database version from 6 to 7 in src/features/pwa/db/database.ts
  - DEPENDENCIES: Task 4 (need User types for session store)
  - VALIDATION: `npm run typecheck` passes

Task 6: UPDATE src/features/pwa/db/database.ts
  - IMPLEMENT: onupgradeneeded handler for version 7 (create sessions + preferences stores)
  - FOLLOW pattern: Existing version 6 migration in database.ts
  - CRITICAL: Create indexes for preferences.userId
  - DEPENDENCIES: Task 5 (need updated Database.types.ts)
  - VALIDATION: Open IndexedDB in Chrome DevTools → Application → IndexedDB → see new stores

Task 7: CREATE src/features/auth/validation/authSchemas.ts
  - IMPLEMENT: Zod schemas for sign-in and sign-up forms
  - FOLLOW pattern: Data Models section above (lines 354-384)
  - NAMING: camelCase schema names (signInSchema, signUpSchema)
  - DEPENDENCIES: None (Zod already installed)
  - VALIDATION: `npm run typecheck` passes

# ========================================
# WEEK 2: AUTH CONTEXT (Days 6-10)
# ========================================

Task 8: CREATE src/features/auth/context/AuthContext.tsx
  - IMPLEMENT: React Context definitions (AuthStateContext, AuthActionsContext)
  - FOLLOW pattern: src/lib/theme/ThemeProvider.tsx (lines 9-35)
  - NAMING: AuthStateContext (state only), AuthActionsContext (actions only)
  - DEPENDENCIES: Task 4 (need AuthState, AuthActions types)
  - VALIDATION: Can export createContext without errors

Task 9: CREATE src/features/auth/hooks/useSession.ts
  - IMPLEMENT: Hook for managing session (refreshSession, checkExpiry, etc.)
  - FOLLOW pattern: PRPs/research/token_refresh_strategies_offline_pwa.md (lines 486-568)
  - METHODS: refreshSession(), checkOfflineDuration(), getSession()
  - DEPENDENCIES: Task 1 (need supabase client)
  - VALIDATION: Can call refreshSession() and see TOKEN_REFRESHED event

Task 10: CREATE src/features/auth/services/authService.ts
  - IMPLEMENT: Auth service with Supabase operations (signIn, signUp, signOut, convertAnonymous)
  - FOLLOW pattern: src/features/pwa/db/repository.ts (service class structure)
  - METHODS: signInAnonymously(), signIn(), signUp(), signOut(), convertToAuthenticated()
  - DEPENDENCIES: Task 1 (need supabase client), Task 7 (need validation schemas)
  - VALIDATION: Can call signInAnonymously() and receive user object

Task 11: CREATE src/features/auth/context/AuthProvider.tsx
  - IMPLEMENT: AuthProvider component with onAuthStateChange listener
  - FOLLOW pattern: src/lib/theme/ThemeProvider.tsx (lines 37-167) + PRPs/research/token_refresh_strategies_offline_pwa.md (lines 444-483)
  - STATE: user, session, loading, error, isOnline, offlineDays
  - METHODS: signIn, signOut, signUp, convertToAuthenticated
  - DEPENDENCIES: Task 8 (AuthContext), Task 9 (useSession), Task 10 (authService)
  - VALIDATION: Wrap app with AuthProvider, see INITIAL_SESSION event in console

Task 12: CREATE src/features/auth/hooks/useAuth.ts
  - IMPLEMENT: useContext wrapper for AuthStateContext + AuthActionsContext
  - FOLLOW pattern: src/lib/theme/ThemeProvider.tsx (lines 169-179)
  - EXPORTS: useAuth() → { user, session, loading, error, signIn, signOut, ... }
  - DEPENDENCIES: Task 11 (AuthProvider)
  - VALIDATION: Can call useAuth() in component and access user state

Task 13: UPDATE src/app/App.tsx
  - IMPLEMENT: Wrap app with AuthProvider (below ThemeProvider, above ErrorBoundary)
  - FOLLOW pattern: Existing ThemeProvider wrapper (lines 139-152)
  - PLACEMENT: <ThemeProvider><AuthProvider><BrowserRouter>...</BrowserRouter></AuthProvider></ThemeProvider>
  - DEPENDENCIES: Task 11 (AuthProvider)
  - VALIDATION: App renders without errors, useAuth() works in components

# ========================================
# WEEK 3: UI COMPONENTS (Days 11-15)
# ========================================

Task 14: CREATE src/features/auth/components/SignInForm.tsx
  - IMPLEMENT: Email/password form with validation (React Hook Form + Zod)
  - FOLLOW pattern: src/features/setlists/components/SetlistForm.tsx (form structure)
  - FIELDS: email (input), password (input type="password"), submit button
  - DEPENDENCIES: Task 7 (authSchemas), Task 12 (useAuth hook)
  - VALIDATION: Form shows validation errors, calls signIn() on submit

Task 15: CREATE src/features/auth/components/SignUpForm.tsx
  - IMPLEMENT: Email/password/confirmPassword form with validation
  - FOLLOW pattern: Task 14 (SignInForm structure)
  - FIELDS: email, password, confirmPassword, submit button
  - DEPENDENCIES: Task 7 (authSchemas), Task 12 (useAuth hook)
  - VALIDATION: Form shows validation errors, calls signUp() on submit

Task 16: CREATE src/features/auth/components/SignInModal.tsx
  - IMPLEMENT: Desktop modal with toggle between sign-in and sign-up
  - FOLLOW pattern: src/features/setlists/components/AddArrangementModal.tsx (modal structure)
  - COMPONENTS: Dialog, DialogContent, DialogTitle, DialogDescription (from shadcn/ui)
  - DEPENDENCIES: Task 14 (SignInForm), Task 15 (SignUpForm)
  - VALIDATION: Modal opens, can toggle between sign-in/sign-up, closes on success

Task 17: CREATE src/features/auth/pages/SignInPage.tsx
  - IMPLEMENT: Mobile dedicated sign-in page (/auth/signin)
  - FOLLOW pattern: src/features/profile/pages/ProfilePage.tsx (page structure)
  - LAYOUT: Full-page form with back button, logo, form, footer links
  - DEPENDENCIES: Task 14 (SignInForm)
  - VALIDATION: Can navigate to /auth/signin, form works, redirects after sign-in

Task 18: CREATE src/features/auth/pages/SignUpPage.tsx
  - IMPLEMENT: Mobile dedicated sign-up page (/auth/signup)
  - FOLLOW pattern: Task 17 (SignInPage structure)
  - LAYOUT: Full-page form with back button, logo, form, footer links
  - DEPENDENCIES: Task 15 (SignUpForm)
  - VALIDATION: Can navigate to /auth/signup, form works, redirects after sign-up

Task 19: CREATE src/features/auth/components/UserDropdown.tsx
  - IMPLEMENT: User avatar + dropdown menu (Profile, Settings, Sign Out)
  - FOLLOW pattern: src/components/ui/dropdown-menu.jsx (dropdown structure)
  - MENU ITEMS: Profile (navigate to /profile), Settings (/settings), Sign Out (call signOut())
  - DEPENDENCIES: Task 12 (useAuth hook)
  - VALIDATION: Dropdown opens, menu items work, sign out redirects to home

Task 20: UPDATE src/features/shared/components/DesktopHeader.tsx
  - IMPLEMENT: Show "Sign In" button (anonymous) or UserDropdown (authenticated)
  - FOLLOW pattern: Existing header structure (lines 1-115)
  - CONDITIONAL: {user?.isAnonymous ? <Button>Sign In</Button> : <UserDropdown user={user} />}
  - DEPENDENCIES: Task 12 (useAuth), Task 16 (SignInModal), Task 19 (UserDropdown)
  - VALIDATION: Header shows correct state, sign-in button opens modal, dropdown works

Task 21: UPDATE src/features/shared/components/MobileNav.tsx
  - IMPLEMENT: Profile tab shows "Sign In" icon (anonymous) or user initials (authenticated)
  - FOLLOW pattern: Existing nav structure (lines 28-147)
  - CONDITIONAL: {user?.isAnonymous ? <User icon /> : <Avatar>{initials}</Avatar>}
  - DEPENDENCIES: Task 12 (useAuth)
  - VALIDATION: Nav shows correct state, profile tab navigates to /profile or /auth/signin

Task 22: CREATE src/features/auth/components/SignInBanner.tsx
  - IMPLEMENT: Dismissible banner ("Sign in to sync your data across devices")
  - FOLLOW pattern: src/features/pwa/components/OfflineIndicator.tsx (banner structure)
  - ACTIONS: [Sign In] [Create Account] [X dismiss]
  - DEPENDENCIES: Task 12 (useAuth), Task 16 (SignInModal)
  - VALIDATION: Banner shows on homepage (anonymous only), dismisses, reappears after refresh

# ========================================
# WEEK 4: DATA MIGRATION (Days 16-20)
# ========================================

Task 23: CREATE Supabase database schema (SQL migration)
  - IMPLEMENT: Run SQL migration to create songs, arrangements, setlists tables with RLS
  - FOLLOW pattern: PRPs/phase5-authentication-flow-prd.md (lines 495-622)
  - TABLES: songs (with user_id, is_public), arrangements (same), setlists (user_id only)
  - CRITICAL: Enable RLS on all tables, create SELECT/INSERT/UPDATE/DELETE policies
  - DEPENDENCIES: Task 2 (Supabase project)
  - VALIDATION: Can query tables in Supabase SQL editor, RLS blocks unauthorized access

Task 24: CREATE src/features/auth/services/dataMigrationService.ts
  - IMPLEMENT: Service to upload local IndexedDB data to Supabase on first sign-in
  - FOLLOW pattern: src/features/pwa/db/dataMigration.ts (migration structure)
  - METHODS: uploadSongs(), uploadArrangements(), uploadSetlists(), uploadAll()
  - DEPENDENCIES: Task 1 (supabase client), Task 23 (Supabase tables)
  - VALIDATION: Can call uploadAll() and see data appear in Supabase dashboard

Task 25: CREATE src/features/auth/hooks/useAnonymousConversion.ts
  - IMPLEMENT: Hook for converting anonymous user to authenticated with data upload
  - FOLLOW pattern: Custom hooks in src/features/setlists/hooks/ (hook structure)
  - METHODS: convertToAuthenticated(email, password) → uploads local data → returns user
  - DEPENDENCIES: Task 10 (authService), Task 24 (dataMigrationService)
  - VALIDATION: Can convert anonymous → authenticated, data uploads, user ID preserved

Task 26: UPDATE src/features/auth/components/SignUpForm.tsx
  - IMPLEMENT: Use useAnonymousConversion() instead of direct signUp() for anonymous users
  - FOLLOW pattern: Existing SignUpForm from Task 15
  - CONDITIONAL: if (user?.isAnonymous) { convertToAuthenticated() } else { signUp() }
  - DEPENDENCIES: Task 25 (useAnonymousConversion)
  - VALIDATION: Anonymous user signs up → data uploads → success message

Task 27: UPDATE src/features/profile/pages/ProfilePage.tsx
  - IMPLEMENT: Show "Create Account" CTA (anonymous) or profile details (authenticated)
  - FOLLOW pattern: PRPs/phase5-authentication-flow-prd.md (lines 894-921)
  - CONDITIONAL: {user?.isAnonymous ? <SignUpCTA /> : <ProfileDetails user={user} />}
  - DEPENDENCIES: Task 12 (useAuth), Task 16 (SignInModal)
  - VALIDATION: Profile page shows correct state, sign-in/sign-up works

Task 28: UPDATE src/features/settings/components/AccountSection.tsx
  - IMPLEMENT: Show sign-in status and sync controls
  - FOLLOW pattern: PRPs/phase5-authentication-flow-prd.md (lines 789-831)
  - SECTIONS: Account (email, created date), Data Sync (auto-sync toggles), Sign Out button
  - DEPENDENCIES: Task 12 (useAuth)
  - VALIDATION: Settings shows correct auth state, sign-out button works

# ========================================
# WEEK 5: POLISH & TESTING (Days 21-25)
# ========================================

Task 29: UPDATE vite.config.ts
  - IMPLEMENT: Add Supabase API to cache deny list (prevent service worker from caching auth requests)
  - FOLLOW pattern: Existing navigateFallbackDenylist (lines 37)
  - ADD: navigateFallbackDenylist: [/^\/api/, /supabase\.co/]
  - DEPENDENCIES: None
  - VALIDATION: Service worker does NOT cache Supabase auth requests (check Network tab)

Task 30: ADD Content Security Policy (CSP) meta tag
  - IMPLEMENT: Add CSP header to index.html to prevent XSS attacks
  - FOLLOW pattern: PRPs/research/token_refresh_strategies_offline_pwa.md (lines 252-256)
  - TAG: <meta http-equiv="Content-Security-Policy" content="...">
  - DEPENDENCIES: None
  - VALIDATION: Check CSP in Chrome DevTools → Security → Content Security Policy

Task 31: CREATE src/features/auth/components/AuthGuard.tsx (optional - future Phase 5.1+)
  - IMPLEMENT: HOC for protecting routes (redirect to sign-in if not authenticated)
  - FOLLOW pattern: React Router protected routes pattern
  - USAGE: <Route path="/admin" element={<AuthGuard><AdminPage /></AuthGuard>} />
  - DEPENDENCIES: Task 12 (useAuth)
  - VALIDATION: Can protect route, redirects to /auth/signin if not authenticated

Task 32: Unit tests for authService
  - IMPLEMENT: Vitest tests for signIn, signUp, signOut, convertToAuthenticated
  - FOLLOW pattern: Existing test files in src/features/pwa/db/__tests__/
  - COVERAGE: Happy path, error cases (invalid credentials, network failures)
  - DEPENDENCIES: Task 10 (authService)
  - VALIDATION: `npm run test -- auth` passes, coverage > 80%

Task 33: Integration tests for auth flow
  - IMPLEMENT: E2E test for anonymous → authenticated conversion
  - FOLLOW pattern: Playwright or Cypress (not yet set up - manual testing for MVP)
  - TEST CASES: Sign up, sign in, sign out, token refresh, offline handling
  - DEPENDENCIES: All tasks complete
  - VALIDATION: Manual testing passes all scenarios

Task 34: Update documentation
  - IMPLEMENT: Update CLAUDE.md with Phase 5 completion status
  - FOLLOW pattern: Existing phase completion notes (lines 169-267)
  - SECTIONS: Phase 5 complete, authentication patterns, gotchas
  - DEPENDENCIES: All tasks complete
  - VALIDATION: CLAUDE.md reflects current state
```

### Implementation Patterns & Key Details

```typescript
// ========================================
// PATTERN 1: AuthProvider Implementation
// ========================================
// File: src/features/auth/context/AuthProvider.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, AuthState, AuthActions, AuthSession } from '@/types/User.types';
import { useOnlineStatus } from '@/features/pwa/hooks/useOnlineStatus';
import logger from '@/lib/logger';

// Split contexts for performance (avoid unnecessary re-renders)
const AuthStateContext = createContext<AuthState | undefined>(undefined);
const AuthActionsContext = createContext<AuthActions | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offlineDays, setOfflineDays] = useState(0);

  // Hooks
  const isOnline = useOnlineStatus();

  // CRITICAL: Initialize with anonymous sign-in on first load
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check if session exists in localStorage
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          // Session found - restore user
          logger.info('Session restored from localStorage');
          setUser(mapSupabaseUserToUser(existingSession.user));
          setSession(mapSupabaseSessionToAuthSession(existingSession));
        } else {
          // No session - sign in anonymously
          logger.info('No session found - signing in anonymously');
          const { data, error } = await supabase.auth.signInAnonymously();

          if (error) throw error;

          setUser(mapSupabaseUserToUser(data.user!));
          setSession(mapSupabaseSessionToAuthSession(data.session!));
        }
      } catch (err) {
        logger.error('Auth initialization failed:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // CRITICAL: Listen for auth state changes (token refresh, sign-out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('Auth event:', event);

      switch (event) {
        case 'INITIAL_SESSION':
          // Already handled in initAuth
          break;

        case 'SIGNED_IN':
          setUser(session ? mapSupabaseUserToUser(session.user) : null);
          setSession(session ? mapSupabaseSessionToAuthSession(session) : null);
          setError(null);
          break;

        case 'TOKEN_REFRESHED':
          logger.debug('Token refreshed successfully');
          setSession(session ? mapSupabaseSessionToAuthSession(session) : null);
          setOfflineDays(0); // Reset offline counter

          // Trigger sync queue processing
          window.dispatchEvent(new CustomEvent('sync-queued-operations'));
          break;

        case 'SIGNED_OUT':
          // CRITICAL: Check if this is offline sign-out (don't clear user)
          if (!isOnline) {
            logger.warn('Token expired while offline - keeping user logged in locally');
            return; // Don't clear user state
          }

          // Online sign-out - clear everything
          logger.info('User signed out');
          setUser(null);
          setSession(null);
          setError(null);
          window.dispatchEvent(new CustomEvent('clear-user-cache'));
          break;

        case 'USER_UPDATED':
          setUser(session ? mapSupabaseUserToUser(session.user) : null);
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [isOnline]);

  // CRITICAL: Track offline duration
  useEffect(() => {
    const MAX_OFFLINE_DAYS = 14;

    const interval = setInterval(() => {
      if (!isOnline && session) {
        const daysSinceRefresh = Math.floor(
          (Date.now() - session.expiresAt) / (1000 * 60 * 60 * 24)
        );

        setOfflineDays(daysSinceRefresh);

        // Force sign-out if offline too long
        if (daysSinceRefresh > MAX_OFFLINE_DAYS) {
          logger.warn(`Offline for ${daysSinceRefresh} days - forcing sign out`);
          supabase.auth.signOut();
        }
      }
    }, 1000 * 60 * 60 * 24); // Check daily

    return () => clearInterval(interval);
  }, [isOnline, session]);

  // Actions
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      logger.info('User signed in:', data.user.email);
    } catch (err) {
      logger.error('Sign in failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      logger.info('User signed up:', data.user?.email);
    } catch (err) {
      logger.error('Sign up failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      logger.info('User signed out');

      // Sign in anonymously after sign-out (preserve offline-first UX)
      await supabase.auth.signInAnonymously();
    } catch (err) {
      logger.error('Sign out failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const convertToAuthenticated = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // CRITICAL: updateUser() converts anonymous → authenticated (preserves user ID)
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) throw error;

      logger.info('Anonymous user converted to authenticated:', data.user.email);

      // Upload local data to Supabase
      // (Handled by useAnonymousConversion hook)
    } catch (err) {
      logger.error('Conversion failed:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        if (!isOnline) {
          logger.debug('Token refresh skipped (offline)');
          return;
        }

        throw error;
      }

      logger.info('Session refreshed manually');
    } catch (err) {
      logger.error('Session refresh failed:', err);
      throw err;
    }
  };

  // Helper mappers
  function mapSupabaseUserToUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      isAnonymous: supabaseUser.is_anonymous || false,
      createdAt: supabaseUser.created_at,
      lastSignInAt: supabaseUser.last_sign_in_at,
    };
  }

  function mapSupabaseSessionToAuthSession(supabaseSession: any): AuthSession {
    return {
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresAt: supabaseSession.expires_at || 0,
      expiresIn: supabaseSession.expires_in || 0,
      user: mapSupabaseUserToUser(supabaseSession.user),
    };
  }

  // Context values
  const stateValue: AuthState = {
    user,
    session,
    loading,
    error,
    isOnline,
    offlineDays,
  };

  const actionsValue: AuthActions = {
    signInAnonymously: async () => {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    },
    signIn,
    signUp,
    signOut,
    convertToAuthenticated,
    refreshSession,
  };

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

// PATTERN: Custom hooks for accessing contexts
export function useAuthState() {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within AuthProvider');
  }
  return context;
}

export function useAuthActions() {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within AuthProvider');
  }
  return context;
}

// Convenience hook (combines state + actions)
export function useAuth() {
  return {
    ...useAuthState(),
    ...useAuthActions(),
  };
}

// ========================================
// PATTERN 2: Data Migration Service
// ========================================
// File: src/features/auth/services/dataMigrationService.ts

import { supabase } from '@/lib/supabase';
import { initDatabase } from '@/features/pwa/db/database';
import logger from '@/lib/logger';

export class DataMigrationService {
  /**
   * Upload all local IndexedDB data to Supabase on first sign-in
   * CRITICAL: This is a one-time migration, not continuous sync
   */
  async uploadAllLocalData(userId: string): Promise<void> {
    logger.info('Starting data migration to Supabase for user:', userId);

    try {
      const db = await initDatabase();

      // 1. Upload songs
      await this.uploadSongs(db, userId);

      // 2. Upload arrangements
      await this.uploadArrangements(db, userId);

      // 3. Upload setlists
      await this.uploadSetlists(db, userId);

      logger.info('Data migration completed successfully');
    } catch (error) {
      logger.error('Data migration failed:', error);
      throw error;
    }
  }

  private async uploadSongs(db: any, userId: string): Promise<void> {
    const songs = await db.getAll('songs');

    for (const song of songs) {
      // Add userId to song (missing in anonymous data)
      const songWithUserId = {
        ...song,
        user_id: userId,
        is_public: song.isPublic ?? true, // Default to public
      };

      const { error } = await supabase
        .from('songs')
        .upsert(songWithUserId, { onConflict: 'id' });

      if (error) {
        logger.error('Failed to upload song:', song.id, error);
        throw error;
      }
    }

    logger.info(`Uploaded ${songs.length} songs`);
  }

  private async uploadArrangements(db: any, userId: string): Promise<void> {
    const arrangements = await db.getAll('arrangements');

    for (const arrangement of arrangements) {
      // Add userId to arrangement
      const arrangementWithUserId = {
        ...arrangement,
        user_id: userId,
        is_public: arrangement.isPublic ?? true,
      };

      const { error } = await supabase
        .from('arrangements')
        .upsert(arrangementWithUserId, { onConflict: 'id' });

      if (error) {
        logger.error('Failed to upload arrangement:', arrangement.id, error);
        throw error;
      }
    }

    logger.info(`Uploaded ${arrangements.length} arrangements`);
  }

  private async uploadSetlists(db: any, userId: string): Promise<void> {
    const setlists = await db.getAll('setlists');

    for (const setlist of setlists) {
      // Add userId to setlist
      const setlistWithUserId = {
        ...setlist,
        user_id: userId,
      };

      const { error } = await supabase
        .from('setlists')
        .upsert(setlistWithUserId, { onConflict: 'id' });

      if (error) {
        logger.error('Failed to upload setlist:', setlist.id, error);
        throw error;
      }
    }

    logger.info(`Uploaded ${setlists.length} setlists`);
  }
}

// ========================================
// PATTERN 3: User Dropdown Component
// ========================================
// File: src/features/auth/components/UserDropdown.tsx

import { User } from '@/types/User.types';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@/features/shared/hooks/useNavigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, Settings, LogOut } from 'lucide-react';

interface UserDropdownProps {
  user: User;
}

export function UserDropdown({ user }: UserDropdownProps) {
  const { signOut } = useAuth();
  const { navigateToProfile, navigateToSettings } = useNavigation();

  // Get user initials from email (first 2 characters)
  const initials = user.email?.slice(0, 2).toUpperCase() || 'U';

  const handleSignOut = async () => {
    try {
      await signOut();
      // No need to navigate - onAuthStateChange will handle redirect
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              {user.isAnonymous ? 'Anonymous' : 'Authenticated'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={navigateToProfile}>
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={navigateToSettings}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "supabase/migrations/20250114_add_auth.sql"
  - tables: "songs, arrangements, setlists (with user_id, is_public, RLS policies)"
  - rls: "Enable RLS on all tables, create SELECT/INSERT/UPDATE/DELETE policies"

TYPES:
  - update: "src/types/Song.types.ts" (add userId, isPublic)
  - update: "src/types/Arrangement.types.ts" (add userId, isPublic)
  - update: "src/types/Setlist.types.ts" (add userId)
  - create: "src/types/User.types.ts" (User, AuthSession, AuthState, AuthActions)
  - update: "src/types/Database.types.ts" (add sessions, preferences stores)

ROUTING:
  - add to: "src/app/App.tsx"
  - routes:
      - "/auth/signin" → SignInPage (mobile)
      - "/auth/signup" → SignUpPage (mobile)
  - wrap: "App with AuthProvider (below ThemeProvider, above BrowserRouter)"

SERVICE_WORKER:
  - update: "vite.config.ts"
  - change: "Add /supabase\.co/ to navigateFallbackDenylist"
  - why: "Prevent service worker from caching Supabase auth requests"

ENVIRONMENT:
  - create: ".env.local"
  - vars:
      - "VITE_SUPABASE_URL=https://your-project.supabase.co"
      - "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  - security: "Never commit .env.local (already in .gitignore)"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Run after each file creation - fix before proceeding
npm run typecheck              # TypeScript compilation check
npm run lint                   # ESLint check and auto-fix

# Expected: Zero errors. If errors exist, READ output and fix before proceeding.
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test auth service methods
npm run test -- src/features/auth/services/authService.test.ts

# Test auth hooks
npm run test -- src/features/auth/hooks/useAuth.test.ts

# Full test suite for auth feature
npm run test -- src/features/auth/

# Coverage validation
npm run test:coverage

# Expected: All tests pass. Coverage > 80% for auth feature.
```

### Level 3: Integration Testing (System Validation)

```bash
# Application startup validation
npm run dev &
sleep 3  # Allow startup time

# Health check validation
curl -f http://localhost:5173 || echo "Development server not responding"

# Supabase connection test
# 1. Open browser to http://localhost:5173
# 2. Open DevTools → Console
# 3. Look for "INITIAL_SESSION" log from onAuthStateChange
# 4. Should see user object with is_anonymous: true

# Database migration validation
# 1. Open DevTools → Application → IndexedDB → hsa-songbook-db
# 2. Verify version = 7
# 3. Verify 'sessions' and 'preferences' stores exist

# Token refresh validation
# 1. Sign in to app (email/password)
# 2. Wait 5 minutes (or manually trigger refresh)
# 3. Check Console for "TOKEN_REFRESHED" event
# 4. Verify access token updated in Application → Storage → localStorage

# Offline handling validation
# 1. Sign in to app
# 2. DevTools → Network → Set to "Offline"
# 3. Wait for token expiry (or manually expire in localStorage)
# 4. Verify user stays logged in (no redirect to /auth/signin)
# 5. Set to "Online"
# 6. Verify token refreshes automatically

# Multi-device sync validation
# 1. Sign in on Device A (laptop)
# 2. Create new arrangement
# 3. Sign in on Device B (phone) with same credentials
# 4. Verify arrangement appears on Device B
# 5. Edit on Device B
# 6. Refresh Device A
# 7. Verify edits appear on Device A

# Expected: All integrations working, proper responses, no connection errors
```

### Level 4: Creative & Domain-Specific Validation

```bash
# Manual Testing Checklist:

# 1. Anonymous Mode (Offline-First)
# [ ] App launches without sign-in prompt
# [ ] User can browse songs as anonymous
# [ ] User can edit arrangements as anonymous
# [ ] User can create setlists as anonymous
# [ ] Changes persist after app restart (IndexedDB)

# 2. Sign-Up Flow (Anonymous → Authenticated Conversion)
# [ ] Click "Sign In" button in header (desktop) or profile tab (mobile)
# [ ] Toggle to "Sign Up" mode
# [ ] Enter email + password + confirm password
# [ ] Submit form
# [ ] See progress indicator: "Syncing your data..."
# [ ] See success message: "Your data is now synced!"
# [ ] User ID preserved (check in Supabase dashboard)
# [ ] All local data uploaded (songs, arrangements, setlists)

# 3. Sign-In Flow (Existing User)
# [ ] Sign out (user dropdown → Sign Out)
# [ ] App returns to anonymous mode
# [ ] Click "Sign In" button
# [ ] Enter email + password (same as sign-up)
# [ ] Submit form
# [ ] User signed in successfully
# [ ] Data pulled from Supabase (not lost)

# 4. Token Refresh (Automatic)
# [ ] Sign in to app
# [ ] Leave app open for 1 hour (or manually expire token in localStorage)
# [ ] Check Console for "TOKEN_REFRESHED" event
# [ ] No user-visible interruption (no redirect, no error)
# [ ] User can continue editing without re-authentication

# 5. Offline Handling (14-Day Window)
# [ ] Sign in to app
# [ ] Disconnect network (DevTools → Network → Offline)
# [ ] Edit arrangement (saves to IndexedDB)
# [ ] Wait for token expiry (or manually expire in localStorage)
# [ ] User stays logged in (no redirect)
# [ ] See offline indicator: "You're offline. Changes will sync when you reconnect."
# [ ] Reconnect network
# [ ] Token refreshes automatically
# [ ] Changes sync to Supabase

# 6. Multi-Device Sync
# [ ] Sign in on Device A (laptop)
# [ ] Create new arrangement
# [ ] Sign in on Device B (phone) with same credentials
# [ ] Verify arrangement appears on Device B
# [ ] Edit on Device B
# [ ] Refresh Device A (or wait for auto-refresh)
# [ ] Verify edits appear on Device A

# 7. UI State Display
# [ ] Desktop header shows "Sign In" button (anonymous)
# [ ] Desktop header shows user avatar dropdown (authenticated)
# [ ] Mobile nav shows "Profile" tab with "Sign In" icon (anonymous)
# [ ] Mobile nav shows user initials (authenticated)
# [ ] Profile page shows "Create Account" CTA (anonymous)
# [ ] Profile page shows profile details (authenticated)
# [ ] Settings → Account section shows sign-in status

# 8. Sign-Out Flow
# [ ] Click user dropdown → Sign Out
# [ ] User signed out successfully
# [ ] Local data preserved (not deleted)
# [ ] App returns to anonymous mode (new anonymous user ID)
# [ ] Can sign back in with same credentials

# 9. RLS Security
# [ ] Sign in as User A
# [ ] Create private arrangement (isPublic = false)
# [ ] Sign out
# [ ] Sign in as User B
# [ ] Verify User B cannot see User A's private arrangement
# [ ] Create public arrangement (isPublic = true)
# [ ] Sign out
# [ ] Sign in as User A
# [ ] Verify User A can see User B's public arrangement

# 10. Error Handling
# [ ] Try to sign up with existing email → See error: "Email already registered"
# [ ] Try to sign in with wrong password → See error: "Invalid credentials"
# [ ] Disconnect network during sign-in → See error: "Network error"
# [ ] Invalid email format → See validation error: "Invalid email address"
# [ ] Weak password → See validation error: "Password must be at least 8 characters"

# Expected: All manual tests pass, no unexpected errors
```

## Final Validation Checklist

### Technical Validation

- [ ] All 4 validation levels completed successfully
- [ ] All tests pass: `npm run test -- src/features/auth/`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] TypeScript strict mode compliance (0 `any` types)
- [ ] Build succeeds: `npm run build`
- [ ] Production preview works: `npm run preview`

### Feature Validation

- [ ] Anonymous user can use app fully offline (no sign-in prompt)
- [ ] User can create account via email/password
- [ ] Anonymous → authenticated conversion preserves user ID
- [ ] Local data uploads to Supabase on first sign-in
- [ ] Token refresh works automatically (no interruption)
- [ ] User stays logged in during 14-day offline period
- [ ] Multi-device sign-in works (same data on phone + laptop)
- [ ] Sign-out preserves local data (for anonymous re-use)
- [ ] All UI locations show correct auth state
- [ ] RLS policies prevent unauthorized data access

### Code Quality Validation

- [ ] Follows existing codebase patterns (ThemeProvider, BaseRepository, hooks)
- [ ] File placement matches desired codebase tree structure
- [ ] Anti-patterns avoided (see below)
- [ ] Dependencies properly managed and imported
- [ ] Configuration changes properly integrated (vite.config.ts, index.html CSP)
- [ ] No console.log statements (use logger from '@/lib/logger')
- [ ] All TypeScript interfaces exported and reusable
- [ ] Error boundaries added for auth components

### Documentation & Deployment

- [ ] Code is self-documenting with clear variable/function names
- [ ] Logs are informative but not verbose (use logger.debug for noisy logs)
- [ ] Environment variables documented (.env.local example in README)
- [ ] CLAUDE.md updated with Phase 5 completion status
- [ ] Supabase project created and credentials saved securely
- [ ] .env.local added to .gitignore (verify before committing)

---

## Anti-Patterns to Avoid

- ❌ Don't sign user out during offline token refresh failures (keep logged in locally)
- ❌ Don't create new user during anonymous conversion (use updateUser(), not signUp())
- ❌ Don't store refresh token in IndexedDB (use localStorage for sync access)
- ❌ Don't cache Supabase auth requests in service worker (add to deny list)
- ❌ Don't use signUp() for anonymous conversion (creates new user ID)
- ❌ Don't forget to bump IndexedDB version (6 → 7) when adding auth stores
- ❌ Don't skip RLS policies (all tables MUST have RLS enabled)
- ❌ Don't expose service_role key on frontend (use anon key only)
- ❌ Don't put user state and auth actions in same context (causes re-renders)
- ❌ Don't trust navigator.onLine (verify with actual network request)
- ❌ Don't clear local data on sign-out (preserve for anonymous re-use)
- ❌ Don't modify BaseRepository directly (extend with SupabaseRepository)
- ❌ Don't skip CSP header (critical for XSS mitigation)
- ❌ Don't commit .env.local (contains Supabase credentials)
- ❌ Don't use console.log in production code (use logger from '@/lib/logger')

---

## Confidence Score: 9/10

**Rationale**: This PRP provides comprehensive context for one-pass implementation success:
- ✅ Exact patterns to follow (ThemeProvider → AuthProvider mapping)
- ✅ Complete code examples for critical patterns (AuthProvider, DataMigrationService, UserDropdown)
- ✅ Detailed gotchas with solutions (token refresh, RLS, IndexedDB migration)
- ✅ Step-by-step implementation tasks with dependencies
- ✅ Multiple validation levels (syntax, unit, integration, manual)
- ✅ Specific file paths and line numbers for reference
- ✅ Comprehensive error handling patterns
- ✅ Security considerations (CSP, RLS, XSS mitigation)

**1-point deduction**: Supabase anonymous auth is relatively new (2024 feature) - edge cases may exist that aren't documented. Recommend thorough testing in development before production deployment.

---

**Document Status:** ✅ Ready for Implementation
**Estimated Effort:** 5 weeks (34 tasks spanning foundation, context, UI, migration, testing)
**Next Step:** Review PRP, set up Supabase project, install dependencies, begin Task 1