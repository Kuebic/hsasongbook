# HSA Songbook: Authentication Integration Analysis

**Date**: October 14, 2025
**Phase**: Pre-Phase 5 Analysis
**Purpose**: Identify existing patterns, components, and architecture decisions for authentication integration

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Data Model Integration](#data-model-integration)
3. [Existing Patterns to Follow](#existing-patterns-to-follow)
4. [Components Requiring Updates](#components-requiring-updates)
5. [PWA Integration Points](#pwa-integration-points)
6. [Repository Pattern Extension](#repository-pattern-extension)
7. [Recommended File Structure](#recommended-file-structure)
8. [Breaking Changes](#breaking-changes)
9. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

The HSA Songbook codebase is **well-prepared for Phase 5 authentication**. The architecture already includes:

- ✅ **Context Provider Pattern**: `ThemeProvider` demonstrates the pattern to follow for `AuthProvider`
- ✅ **Generic Repository Pattern**: Type-safe `BaseRepository<T>` ready for user data
- ✅ **Offline-First Architecture**: IndexedDB + sync queue infrastructure in place
- ✅ **TypeScript Strict Mode**: Full type safety with zero `any` types
- ✅ **Custom Hook Pattern**: Consistent `use*.ts` naming and structure
- ✅ **Error Handling**: Custom error classes (e.g., `StorageQuotaExceededError`)
- ✅ **Environment-Aware Config**: Centralized configuration with dev/prod overrides

**Key Finding**: The codebase follows **vertical slice architecture** consistently. The auth feature should mirror the structure of `features/pwa/`, `features/settings/`, and `features/profile/`.

---

## Data Model Integration

### 1. Type Definitions Requiring User ID

#### **Song Type** (`src/types/Song.types.ts`)
```typescript
// Current:
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
  // Future fields for Phase 5
  compositionYear?: number;
  source?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Phase 5 Addition:
export interface Song {
  // ... existing fields ...
  userId?: string; // Owner of the song (null = public/system song)
  isPublic: boolean; // Whether song is visible to all users
  createdBy?: string; // Original creator user ID
  sharedWith?: string[]; // Array of user IDs with read access
}
```

**Location**: `/home/kenei/code/github/Kuebic/hsasongbook/src/types/Song.types.ts` (Lines 8-25)

---

#### **Arrangement Type** (`src/types/Arrangement.types.ts`)
```typescript
// Current:
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
  // Future fields for Phase 5 (sync support)
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
  lastAccessedAt?: number;
}

// Phase 5 Addition:
export interface Arrangement {
  // ... existing fields ...
  userId?: string; // Owner of the arrangement
  isPublic: boolean; // Visibility flag
  createdBy?: string; // Original creator
  sharedWith?: string[]; // Shared access list
}
```

**Location**: `/home/kenei/code/github/Kuebic/hsasongbook/src/types/Arrangement.types.ts` (Lines 8-27)

---

#### **Setlist Type** (`src/types/Database.types.ts`)
```typescript
// Current:
export interface Setlist {
  id: string;
  name: string;
  description?: string;
  performanceDate?: string;
  songs: SetlistSong[];
  createdAt: string;
  updatedAt: string;
  // Future: sync support
  syncStatus?: 'pending' | 'synced' | 'conflict';
  version?: number;
}

// Phase 5 Addition:
export interface Setlist {
  // ... existing fields ...
  userId: string; // Owner (required for setlists)
  isPublic: boolean; // Public/private flag
  sharedWith?: string[]; // Collaborators
  teamId?: string; // Optional team/organization ID
}
```

**Location**: `/home/kenei/code/github/Kuebic/hsasongbook/src/types/Database.types.ts` (Lines 94-105)

---

### 2. IndexedDB Schema Extensions

**Current Schema**: `/home/kenei/code/github/Kuebic/hsasongbook/src/types/Database.types.ts` (Lines 1-151)

```typescript
// Phase 5 Addition: New object stores
export interface HSASongbookDB extends DBSchema {
  // ... existing stores (songs, arrangements, setlists, etc.) ...

  // NEW: User profile store
  users: {
    key: string; // User ID from Supabase
    value: UserProfile;
    indexes: {
      'by-email': string;
      'by-username': string;
    };
  };

  // NEW: Authentication tokens
  authTokens: {
    key: string; // Token type ('access', 'refresh')
    value: AuthToken;
    indexes: {
      'by-expiry': number;
    };
  };

  // UPDATED: Add user-based indexes to existing stores
  songs: {
    key: string;
    value: Song;
    indexes: {
      'by-title': string;
      'by-artist': string;
      'by-user-id': string; // NEW
      'by-is-public': boolean; // NEW
    };
  };

  arrangements: {
    key: string;
    value: Arrangement;
    indexes: {
      'by-song-id': string;
      'by-key': string;
      'by-rating': number;
      'by-favorites': number;
      'by-created-at': string;
      'by-last-accessed': number;
      'by-user-id': string; // NEW
      'by-is-public': boolean; // NEW
    };
  };

  setlists: {
    key: string;
    value: Setlist;
    indexes: {
      'by-name': string;
      'by-performance-date': string;
      'by-user-id': string; // NEW (required for setlists)
      'by-is-public': boolean; // NEW
    };
  };
}
```

**New Type Definitions Needed**:

```typescript
// src/features/auth/types/User.types.ts
export interface UserProfile {
  id: string; // Supabase user ID
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  teamId?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultKey: string;
  defaultTempo: number;
  autoTranspose: boolean;
  // ... other preferences
}

export interface AuthToken {
  type: 'access' | 'refresh';
  token: string;
  expiresAt: number; // Unix timestamp
  refreshToken?: string;
}
```

---

## Existing Patterns to Follow

### 1. Context Provider Pattern

**Reference**: `/home/kenei/code/github/Kuebic/hsasongbook/src/lib/theme/ThemeProvider.tsx`

**Pattern Analysis**:
- ✅ **Location**: `src/lib/theme/ThemeProvider.tsx` (standalone provider)
- ✅ **Structure**:
  - Context creation with `createContext`
  - Provider component with props interface
  - Custom hook (`useTheme`) with error boundary
  - State persistence to `localStorage`
  - TypeScript interfaces for all types
- ✅ **Error Handling**: Throws error if used outside provider
- ✅ **Documentation**: Comprehensive JSDoc comments

**Auth Provider Should Mirror This**:

```typescript
// src/features/auth/context/AuthProvider.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { AuthProviderProps, AuthProviderState } from './types';

const initialState: AuthProviderState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
};

const AuthContext = createContext<AuthProviderState>(initialState);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from Supabase
  useEffect(() => {
    // Check for existing session
    // Set up auth state listener
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
    signUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**App.tsx Integration** (Line 139):
```typescript
// Current:
<ThemeProvider defaultTheme="system" storageKey="hsasongbook-theme">
  <ErrorBoundary ...>
    <BrowserRouter>
      <AppWithFeatures />
    </BrowserRouter>
  </ErrorBoundary>
</ThemeProvider>

// Phase 5:
<ThemeProvider defaultTheme="system" storageKey="hsasongbook-theme">
  <AuthProvider> {/* NEW */}
    <ErrorBoundary ...>
      <BrowserRouter>
        <AppWithFeatures />
      </BrowserRouter>
    </ErrorBoundary>
  </AuthProvider>
</ThemeProvider>
```

---

### 2. Custom Hook Pattern

**Reference Examples**:
- `/home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/hooks/useOnlineStatus.ts`
- `/home/kenei/code/github/Kuebic/hsasongbook/src/features/shared/hooks/useNavigation.ts`

**Pattern Characteristics**:
- ✅ **Naming**: `use*.ts` (camelCase)
- ✅ **Return Type Interface**: Explicitly defined return type
- ✅ **TypeScript Strict Mode**: All parameters and returns typed
- ✅ **JSDoc Documentation**: Comprehensive comments
- ✅ **Error Handling**: Try/catch with logger
- ✅ **Custom Events**: Uses `window.dispatchEvent` for app-wide notifications

**Example Hook Structure** (from `useOnlineStatus.ts`):

```typescript
export interface UseOnlineStatusReturn {
  isOnline: boolean;
  lastOnlineTime: number;
  lastOfflineTime: number | null;
  checkConnection: () => Promise<boolean>;
  getConnectionInfo: () => ConnectionInfo;
  // ... more utilities
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  // ... implementation

  return {
    isOnline,
    lastOnlineTime,
    lastOfflineTime,
    checkConnection,
    getConnectionInfo,
  };
}
```

**Auth Hooks to Create**:

1. **`useAuth()`** - Access auth context (already defined above)
2. **`useAuthSync()`** - Sync local data with Supabase when user signs in
3. **`usePermissions()`** - Check if user can edit/delete/share resources
4. **`useCollaboration()`** - Manage shared access to songs/setlists

---

### 3. Repository Pattern Extension

**Reference**: `/home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/db/repository.ts`

**Current Pattern**:
- ✅ **Generic Base Class**: `BaseRepository<T extends BaseEntity>`
- ✅ **Type-Safe CRUD**: All operations return typed entities
- ✅ **Sync Queue Integration**: Automatically queues changes for sync
- ✅ **Storage Quota Management**: Checks quota before writes
- ✅ **Error Handling**: Custom error classes (`StorageQuotaExceededError`)

**Key Methods to Extend for Auth**:

```typescript
// src/features/pwa/db/repository.ts (Lines 17-357)
abstract class BaseRepository<T extends BaseEntity> {
  async save(entity: Partial<T>): Promise<T> {
    // NEEDS: Add userId validation
    // NEEDS: Check permissions (can user edit this?)
    // NEEDS: Set userId on new entities
  }

  async delete(id: string): Promise<void> {
    // NEEDS: Check ownership (can user delete this?)
  }

  async getAll(): Promise<T[]> {
    // NEEDS: Filter by userId (only show user's + public items)
  }
}
```

**New Repository Needed**:

```typescript
// src/features/auth/db/UserRepository.ts
export class UserRepository extends BaseRepository<UserProfile> {
  constructor() {
    super('users');
  }

  async getByEmail(email: string): Promise<UserProfile | null> {
    return await this.searchByIndex('by-email', email);
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    // Get current user from auth context
  }

  async updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserProfile> {
    // Update user preferences
  }
}
```

---

### 4. Error Handling Pattern

**Reference**: `/home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/utils/storageManager.ts` (Lines 453-461)

**Pattern**:
```typescript
export class StorageQuotaExceededError extends Error {
  public readonly details: Record<string, unknown>;

  constructor(message: string = 'Storage quota exceeded', details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'StorageQuotaExceededError';
    this.details = details;
  }
}
```

**Auth Errors to Create**:

```typescript
// src/features/auth/utils/errors.ts
export class AuthenticationError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class PermissionDeniedError extends Error {
  public readonly resource: string;
  public readonly action: string;

  constructor(resource: string, action: string) {
    super(`Permission denied: Cannot ${action} ${resource}`);
    this.name = 'PermissionDeniedError';
    this.resource = resource;
    this.action = action;
  }
}

export class SyncConflictError extends Error {
  public readonly localVersion: number;
  public readonly remoteVersion: number;
  public readonly entityId: string;

  constructor(entityId: string, localVersion: number, remoteVersion: number) {
    super(`Sync conflict for ${entityId}: local v${localVersion}, remote v${remoteVersion}`);
    this.name = 'SyncConflictError';
    this.entityId = entityId;
    this.localVersion = localVersion;
    this.remoteVersion = remoteVersion;
  }
}
```

---

## Components Requiring Updates

### 1. Navigation Components

#### **MobileNav** (`src/features/shared/components/MobileNav.tsx`)

**Current State**: 4 buttons (Back, Home, Setlists, Settings)
**Location**: Lines 28-147

**Changes Needed**:
- ❌ **No major changes required** - Component is auth-agnostic
- ✅ **Optional Enhancement**: Add profile icon when user is signed in
- ✅ **Optional Enhancement**: Badge notification for sync status

**Suggested Update**:
```typescript
// Add to MobileNav.tsx (optional)
const { user } = useAuth(); // NEW

{/* Profile/Sign In Button - replaces Settings? */}
<Button
  variant="ghost"
  onClick={() => navigate(user ? '/profile' : '/sign-in')}
  aria-label={user ? 'View profile' : 'Sign in'}
  className={cn(/* ... */)}
>
  {user ? (
    <Avatar className="h-5 w-5">
      <AvatarImage src={user.avatarUrl} />
      <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
    </Avatar>
  ) : (
    <User className="h-5 w-5" />
  )}
  <span className="text-xs">{user ? 'Profile' : 'Sign In'}</span>
</Button>
```

---

#### **DesktopHeader** (`src/features/shared/components/DesktopHeader.tsx`)

**Expected Location**: This file doesn't exist yet (Phase 4.5 task)

**Phase 5 Requirements**:
- Display user avatar + name when signed in
- "Sign In" button when signed out
- Dropdown menu: Profile, Settings, Sign Out
- Sync status indicator (syncing/synced/offline)

**Suggested Structure**:
```typescript
// src/features/shared/components/DesktopHeader.tsx
export default function DesktopHeader() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/">HSA Songbook</Link>
          <nav>
            <Link to="/setlists">Setlists</Link>
            <Link to="/settings">Settings</Link>
          </nav>
        </div>

        {/* User Menu */}
        <div>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar>
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/sign-in')}>Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
}
```

---

### 2. Settings Page

#### **AccountSection** (`src/features/settings/components/AccountSection.tsx`)

**Current State**: Placeholder with disabled button
**Location**: Lines 1-47

**Changes Needed**:
```typescript
// src/features/settings/components/AccountSection.tsx
import { useAuth } from '@/features/auth'; // NEW

export default function AccountSection() {
  const { user, isAuthenticated, signOut } = useAuth(); // NEW

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in to sync your data across devices and collaborate with your team.
          </p>
          <Button onClick={() => navigate('/sign-in')}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Signed in state
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.displayName || user.email}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Button variant="outline" onClick={signOut}>
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### 3. Profile Page

#### **ProfilePage** (`src/features/profile/pages/ProfilePage.tsx`)

**Current State**: Placeholder for Phase 5
**Location**: Lines 1-103

**Changes Needed**:
- **Replace entire component** with functional profile management
- Add edit profile form (name, avatar upload)
- Display user stats (songs created, setlists, etc.)
- List shared resources

**Suggested Structure**:
```typescript
// src/features/profile/pages/ProfilePage.tsx
export function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <SimplePageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Breadcrumbs items={breadcrumbs} />

        {/* Profile Header */}
        <ProfileHeader user={user} />

        {/* Tabs: Overview, Settings, Shared */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="shared">Shared with Me</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <UserStatsWidget userId={user.id} />
            <RecentActivityFeed userId={user.id} />
          </TabsContent>

          <TabsContent value="settings">
            <EditProfileForm user={user} />
          </TabsContent>

          <TabsContent value="shared">
            <SharedResourcesList userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </SimplePageTransition>
  );
}
```

---

### 4. Pages Requiring Auth State

**Pages with Different Content Based on Auth**:

| Page | Current State | Auth-Aware Changes |
|------|---------------|-------------------|
| **SearchPage** (`/`) | Public | Show "My Songs" filter when signed in |
| **SongPage** (`/song/:slug`) | Public | Show "Edit" button if user owns song |
| **ArrangementPage** | Public | Show "Edit" button if user owns arrangement |
| **SetlistsIndexPage** | Public | Filter to user's setlists + shared |
| **SetlistPage** | Public | Show "Edit" button if user owns setlist |
| **SettingsPage** | Public | Add "Account" section (already has placeholder) |
| **ProfilePage** | Placeholder | Require authentication, redirect if not signed in |

**Implementation Pattern**:

```typescript
// Example: SongPage with auth awareness
export function SongPage() {
  const { user } = useAuth();
  const song = /* ... fetch song ... */;

  const canEdit = user && (song.userId === user.id || song.createdBy === user.id);

  return (
    <div>
      {/* Song details */}

      {canEdit && (
        <Button onClick={() => navigate(`/song/${song.slug}/edit`)}>
          Edit Song
        </Button>
      )}
    </div>
  );
}
```

---

## PWA Integration Points

### 1. Service Worker Configuration

**Location**: `/home/kenei/code/github/Kuebic/hsasongbook/vite.config.ts` (Lines 1-128)

**Current State**:
- ✅ **Workbox Configured**: CacheFirst, StaleWhileRevalidate, NetworkFirst strategies
- ✅ **API Cache Strategy**: NetworkFirst with 10s timeout (Line 104-113)
- ✅ **Environment-Aware**: Dev vs. prod configurations

**Phase 5 Changes**:
```typescript
// vite.config.ts - Update API cache pattern
{
  // Current:
  urlPattern: /^https:\/\/api\./,
  handler: 'NetworkFirst',

  // Phase 5 Update:
  urlPattern: /^https:\/\/.*\.supabase\.co\//, // NEW: Match Supabase URLs
  handler: 'NetworkFirst',
  options: {
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 5, // Faster timeout for API calls
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 5, // 5 minutes
    },
    plugins: [
      {
        // NEW: Add auth headers to cached requests
        cacheWillUpdate: async ({ response }) => {
          // Only cache successful authenticated responses
          if (response.status === 200 || response.status === 304) {
            return response;
          }
          return null;
        },
      },
    ],
  },
}
```

---

### 2. Offline Indicator Integration

**Location**: `/home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/components/OfflineIndicator.tsx`

**Phase 5 Enhancement**:
```typescript
// Add sync status to offline indicator
export default function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();
  const { syncStatus, pendingChanges } = useAuthSync(); // NEW

  if (isOnline && syncStatus === 'synced') {
    return null; // Hide when online and synced
  }

  return (
    <div className="offline-banner">
      {!isOnline && <p>You are offline. Changes will sync when reconnected.</p>}
      {isOnline && syncStatus === 'syncing' && (
        <p>Syncing {pendingChanges} changes...</p>
      )}
      {isOnline && syncStatus === 'error' && (
        <p>Sync failed. <button>Retry</button></p>
      )}
    </div>
  );
}
```

---

### 3. Network State Handling

**Pattern**: `/home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/hooks/useOnlineStatus.ts` (Lines 1-437)

**Key Features to Leverage**:
- ✅ **Connection Detection**: `useOnlineStatus()` hook
- ✅ **Retry Queue**: `useConnectionManager()` hook
- ✅ **Bandwidth Awareness**: `useBandwidthAware()` hook
- ✅ **Custom Events**: `connection-restored`, `connection-lost` events

**Auth Integration**:

```typescript
// src/features/auth/hooks/useAuthSync.ts
export function useAuthSync() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { executeWhenOnline } = useConnectionManager();

  // Listen for connection-restored event to trigger sync
  useEffect(() => {
    const handleConnectionRestored = async () => {
      if (user) {
        await syncLocalChangesToSupabase();
      }
    };

    window.addEventListener('connection-restored', handleConnectionRestored);
    return () => window.removeEventListener('connection-restored', handleConnectionRestored);
  }, [user]);

  // ... sync logic
}
```

---

### 4. Sync Queue Integration

**Reference**: `/home/kenei/code/github/Kuebic/hsasongbook/src/types/Database.types.ts` (Lines 59-67, 119-128)

**Current Sync Queue Schema**:
```typescript
syncQueue: {
  key: string;
  value: SyncQueueItem;
  indexes: {
    'by-type': string;
    'by-timestamp': string;
  };
}

export interface SyncQueueItem {
  id: string;
  type: 'song' | 'arrangement' | 'setlist';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  data: unknown;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}
```

**Phase 5 Enhancement**:
```typescript
// Add userId to sync queue items
export interface SyncQueueItem {
  id: string;
  type: 'song' | 'arrangement' | 'setlist' | 'user'; // NEW: user type
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  userId: string; // NEW: Track which user made the change
  data: unknown;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  syncedAt?: string; // NEW: When sync completed
  error?: string; // NEW: Last error message
}
```

**Sync Logic**:

```typescript
// src/features/auth/services/syncService.ts
export class SyncService {
  async syncPendingChanges(userId: string): Promise<SyncResult> {
    const db = await getDatabase();
    const syncQueue = await db.getAll('syncQueue');

    // Filter to user's changes only
    const userChanges = syncQueue.filter(item => item.userId === userId);

    for (const item of userChanges) {
      try {
        await this.syncItem(item);
        await db.delete('syncQueue', item.id);
      } catch (error) {
        // Update retry count
        item.retryCount++;
        if (item.retryCount < item.maxRetries) {
          await db.put('syncQueue', item);
        } else {
          // Log failed sync
          logger.error(`Sync failed permanently for ${item.entityId}`, error);
        }
      }
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    const { type, operation, entityId, data } = item;

    // Call Supabase API based on operation
    switch (operation) {
      case 'create':
        await supabase.from(type).insert(data);
        break;
      case 'update':
        await supabase.from(type).update(data).eq('id', entityId);
        break;
      case 'delete':
        await supabase.from(type).delete().eq('id', entityId);
        break;
    }
  }
}
```

---

## Repository Pattern Extension

### 1. Permission Checking in Base Repository

**Current Location**: `/home/kenei/code/github/Kuebic/hsasongbook/src/features/pwa/db/repository.ts` (Lines 17-357)

**Methods Requiring Permission Checks**:

```typescript
// BaseRepository<T> - Add permission utilities
abstract class BaseRepository<T extends BaseEntity> {
  // NEW: Get current user ID
  protected async getCurrentUserId(): Promise<string | null> {
    // Use dynamic import to avoid circular dependencies
    const { getCurrentUser } = await import('@/features/auth');
    const user = getCurrentUser();
    return user?.id || null;
  }

  // NEW: Check if user can edit entity
  protected async canEdit(entity: T & { userId?: string }): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false; // Not authenticated

    // User owns the entity
    if (entity.userId === userId) return true;

    // Check shared access (if entity supports it)
    if ('sharedWith' in entity && Array.isArray(entity.sharedWith)) {
      return entity.sharedWith.includes(userId);
    }

    return false;
  }

  // UPDATED: Save with permission check
  async save(entity: Partial<T>): Promise<T> {
    const userId = await this.getCurrentUserId();

    // Check permissions for updates
    if (entity.id) {
      const existing = await this.getById(entity.id);
      if (existing) {
        const canEdit = await this.canEdit(existing as T & { userId?: string });
        if (!canEdit) {
          throw new PermissionDeniedError(this.storeName, 'update');
        }
      }
    }

    // Set userId for new entities
    if (!entity.id && userId) {
      (entity as T & { userId?: string }).userId = userId;
    }

    // ... rest of save logic (existing)
  }

  // UPDATED: Delete with permission check
  async delete(id: string): Promise<void> {
    const entity = await this.getById(id);

    if (entity) {
      const canEdit = await this.canEdit(entity as T & { userId?: string });
      if (!canEdit) {
        throw new PermissionDeniedError(this.storeName, 'delete');
      }

      // ... rest of delete logic (existing)
    }
  }

  // UPDATED: GetAll filtered by user access
  async getAll(): Promise<T[]> {
    const userId = await this.getCurrentUserId();
    const db = await this.getDB();
    const allItems = await db.getAll(this.storeName) as T[];

    if (!userId) {
      // Not authenticated - only show public items
      return allItems.filter(item =>
        'isPublic' in item && item.isPublic === true
      );
    }

    // Authenticated - show user's items + public items + shared items
    return allItems.filter(item => {
      // User owns it
      if ('userId' in item && item.userId === userId) return true;

      // Public item
      if ('isPublic' in item && item.isPublic === true) return true;

      // Shared with user
      if ('sharedWith' in item && Array.isArray(item.sharedWith)) {
        return item.sharedWith.includes(userId);
      }

      return false;
    });
  }
}
```

---

### 2. User-Specific Repository Methods

**SongRepository Extensions**:

```typescript
// src/features/pwa/db/repository.ts - SongRepository
export class SongRepository extends BaseRepository<Song> {
  // ... existing methods ...

  // NEW: Get user's songs only
  async getByUser(userId: string): Promise<Song[]> {
    return await this.searchByIndex('by-user-id', userId);
  }

  // NEW: Get public songs
  async getPublicSongs(): Promise<Song[]> {
    return await this.searchByIndex('by-is-public', true);
  }

  // NEW: Get songs shared with user
  async getSharedWithUser(userId: string): Promise<Song[]> {
    const allSongs = await this.getAll();
    return allSongs.filter(song =>
      song.sharedWith && song.sharedWith.includes(userId)
    );
  }
}
```

**SetlistRepository Extensions**:

```typescript
// src/features/pwa/db/repository.ts - SetlistRepository
export class SetlistRepository extends BaseRepository<Setlist> {
  // ... existing methods ...

  // NEW: Get user's setlists only (setlists are always user-scoped)
  async getByUser(userId: string): Promise<Setlist[]> {
    return await this.searchByIndex('by-user-id', userId);
  }

  // NEW: Share setlist with another user
  async shareWith(setlistId: string, targetUserId: string): Promise<Setlist> {
    const setlist = await this.getById(setlistId);
    if (!setlist) {
      throw new Error(`Setlist ${setlistId} not found`);
    }

    const canEdit = await this.canEdit(setlist);
    if (!canEdit) {
      throw new PermissionDeniedError('setlist', 'share');
    }

    const sharedWith = setlist.sharedWith || [];
    if (!sharedWith.includes(targetUserId)) {
      sharedWith.push(targetUserId);
      setlist.sharedWith = sharedWith;
      return await this.save(setlist);
    }

    return setlist;
  }

  // NEW: Unshare setlist
  async unshareWith(setlistId: string, targetUserId: string): Promise<Setlist> {
    const setlist = await this.getById(setlistId);
    if (!setlist) {
      throw new Error(`Setlist ${setlistId} not found`);
    }

    const canEdit = await this.canEdit(setlist);
    if (!canEdit) {
      throw new PermissionDeniedError('setlist', 'share');
    }

    const sharedWith = (setlist.sharedWith || []).filter(id => id !== targetUserId);
    setlist.sharedWith = sharedWith;
    return await this.save(setlist);
  }
}
```

---

## Recommended File Structure

### Auth Feature Module

Following the **vertical slice architecture** pattern:

```
src/features/auth/
├── components/          # Auth UI components
│   ├── SignInForm.tsx
│   ├── SignUpForm.tsx
│   ├── PasswordResetForm.tsx
│   ├── SocialAuthButtons.tsx
│   ├── AuthGuard.tsx   # Protected route wrapper
│   └── SyncStatusBadge.tsx
│
├── context/            # Auth context provider
│   ├── AuthProvider.tsx
│   ├── types.ts        # Provider types
│   └── index.ts
│
├── db/                 # IndexedDB repositories
│   └── UserRepository.ts
│
├── hooks/              # Custom hooks
│   ├── useAuth.ts      # Access auth context (re-export from context)
│   ├── useAuthSync.ts  # Sync local data to Supabase
│   ├── usePermissions.ts  # Check user permissions
│   ├── useCollaboration.ts  # Share/unshare resources
│   └── useAuthGuard.ts # Protect routes
│
├── pages/              # Auth pages
│   ├── SignInPage.tsx
│   ├── SignUpPage.tsx
│   ├── PasswordResetPage.tsx
│   └── EmailVerificationPage.tsx
│
├── services/           # Business logic
│   ├── supabaseClient.ts  # Supabase client initialization
│   ├── authService.ts     # Auth operations (sign in, sign out, etc.)
│   └── syncService.ts     # Sync logic between IndexedDB and Supabase
│
├── types/              # Type definitions
│   ├── User.types.ts   # UserProfile, UserPreferences, AuthToken
│   ├── Auth.types.ts   # SignInCredentials, SignUpData, etc.
│   └── Sync.types.ts   # SyncResult, SyncStatus, etc.
│
├── utils/              # Helper functions
│   ├── errors.ts       # Custom error classes
│   ├── permissions.ts  # Permission checking utilities
│   └── validation.ts   # Form validation
│
└── index.ts            # Public API exports
```

### Supabase Configuration

```
src/lib/supabase/
├── client.ts           # Supabase client singleton
├── config.ts           # Supabase configuration
├── types.ts            # Database types (generated from Supabase)
└── migrations/         # Database migration scripts (for reference)
```

### Updated App Structure

```
src/
├── app/
│   ├── App.tsx         # Add AuthProvider wrapper
│   └── main.tsx
│
├── features/
│   ├── auth/           # NEW: Phase 5 authentication
│   ├── arrangements/
│   ├── chordpro/
│   ├── profile/        # UPDATE: Implement real profile page
│   ├── pwa/
│   ├── search/
│   ├── setlists/
│   ├── settings/       # UPDATE: AccountSection shows auth state
│   ├── shared/
│   └── songs/
│
├── lib/
│   ├── config/
│   ├── logger.ts
│   ├── supabase/       # NEW: Supabase client and config
│   ├── theme/
│   └── utils.ts
│
└── types/
    ├── Arrangement.types.ts  # UPDATE: Add userId, isPublic, etc.
    ├── Database.types.ts     # UPDATE: Add users, authTokens stores
    ├── Setlist.types.ts      # UPDATE: Add userId, isPublic, etc.
    └── Song.types.ts         # UPDATE: Add userId, isPublic, etc.
```

---

## Breaking Changes

### 1. Data Model Changes (Non-Breaking)

**Strategy**: Use **optional fields** to maintain backward compatibility

```typescript
// ✅ GOOD: Non-breaking addition
export interface Song {
  id: string;
  title: string;
  artist: string;
  // ... existing fields ...

  // Phase 5: Optional fields (non-breaking)
  userId?: string;
  isPublic?: boolean; // Default to true for existing songs
  createdBy?: string;
  sharedWith?: string[];
}
```

**Migration Strategy**:
1. Add new fields as **optional** (`?`)
2. Create migration script to populate defaults:
   - `isPublic: true` for all existing songs/arrangements
   - `userId: null` for system/public songs
3. Run migration on app startup (idempotent)

**Migration Script**:

```typescript
// src/features/auth/db/authMigration.ts
export async function migrateToAuthSchema(): Promise<void> {
  const db = await getDatabase();

  // Migrate songs
  const songs = await db.getAll('songs');
  for (const song of songs) {
    if (song.isPublic === undefined) {
      song.isPublic = true; // Default to public
      await db.put('songs', song);
    }
  }

  // Migrate arrangements
  const arrangements = await db.getAll('arrangements');
  for (const arr of arrangements) {
    if (arr.isPublic === undefined) {
      arr.isPublic = true;
      await db.put('arrangements', arr);
    }
  }

  // Migrate setlists
  const setlists = await db.getAll('setlists');
  for (const setlist of setlists) {
    if (setlist.isPublic === undefined) {
      setlist.isPublic = false; // Setlists default to private
      await db.put('setlists', setlist);
    }
  }

  logger.info('Auth schema migration completed');
}
```

---

### 2. IndexedDB Version Bump

**Current Version**: 6 (from `src/lib/config/environment.ts`)
**Phase 5 Version**: 7

**Changes Required**:

```typescript
// src/lib/config/index.ts
export const config: Config = {
  database: {
    name: 'HSASongbookDB',
    version: 7, // BUMP from 6 to 7
    reconnectionDelay: 5000,
  },
  // ... rest of config
};
```

**Migration Handler**:

```typescript
// src/features/pwa/db/migrations.ts
export function runMigrations(
  db: IDBPDatabase<HSASongbookDB>,
  oldVersion: number,
  newVersion: number | null,
  transaction: IDBPTransaction<HSASongbookDB>
) {
  // ... existing migrations (v1-v6) ...

  // NEW: Version 7 - Add auth support
  if (oldVersion < 7) {
    logger.info('Running migration v7: Add auth support');

    // Create users store
    const usersStore = db.createObjectStore('users', { keyPath: 'id' });
    usersStore.createIndex('by-email', 'email', { unique: true });
    usersStore.createIndex('by-username', 'username', { unique: false });

    // Create authTokens store
    const tokensStore = db.createObjectStore('authTokens', { keyPath: 'type' });
    tokensStore.createIndex('by-expiry', 'expiresAt', { unique: false });

    // Add user indexes to existing stores
    if (transaction.objectStoreNames.contains('songs')) {
      const songsStore = transaction.objectStore('songs');
      songsStore.createIndex('by-user-id', 'userId', { unique: false });
      songsStore.createIndex('by-is-public', 'isPublic', { unique: false });
    }

    if (transaction.objectStoreNames.contains('arrangements')) {
      const arrangementsStore = transaction.objectStore('arrangements');
      arrangementsStore.createIndex('by-user-id', 'userId', { unique: false });
      arrangementsStore.createIndex('by-is-public', 'isPublic', { unique: false });
    }

    if (transaction.objectStoreNames.contains('setlists')) {
      const setlistsStore = transaction.objectStore('setlists');
      setlistsStore.createIndex('by-user-id', 'userId', { unique: false });
      setlistsStore.createIndex('by-is-public', 'isPublic', { unique: false });
    }
  }
}
```

---

### 3. Repository Method Signature Changes

**Potentially Breaking**: `getAll()` now filters by user access

**Before (Phase 4)**:
```typescript
const songs = await songRepo.getAll(); // Returns ALL songs
```

**After (Phase 5)**:
```typescript
const songs = await songRepo.getAll(); // Returns user's + public + shared songs
```

**Mitigation**:
- Add `getAllUnfiltered()` method for admin/migration use
- Update all existing `getAll()` calls to expect filtered results
- Document behavior change in CHANGELOG

---

## Implementation Checklist

### Phase 5.1: Foundation (Week 1)

- [ ] **Install Dependencies**
  ```bash
  npm install @supabase/supabase-js
  npm install @supabase/auth-helpers-react  # Optional: Helper hooks
  ```

- [ ] **Create Supabase Project**
  - [ ] Set up Supabase project at supabase.com
  - [ ] Configure authentication providers (Email, Google, GitHub)
  - [ ] Create `users` table with RLS policies
  - [ ] Create `songs`, `arrangements`, `setlists` tables
  - [ ] Set up Row Level Security (RLS) policies

- [ ] **Implement Supabase Client**
  - [ ] `src/lib/supabase/client.ts` - Initialize Supabase client
  - [ ] `src/lib/supabase/config.ts` - Environment variables
  - [ ] Add Supabase URL and anon key to `.env.local`

- [ ] **Create Auth Types**
  - [ ] `src/features/auth/types/User.types.ts`
  - [ ] `src/features/auth/types/Auth.types.ts`
  - [ ] Update `src/types/Database.types.ts` with auth stores

- [ ] **Implement AuthProvider**
  - [ ] `src/features/auth/context/AuthProvider.tsx`
  - [ ] `src/features/auth/hooks/useAuth.ts`
  - [ ] Wrap `App.tsx` with `AuthProvider`

- [ ] **Create Error Classes**
  - [ ] `src/features/auth/utils/errors.ts`
    - [ ] `AuthenticationError`
    - [ ] `PermissionDeniedError`
    - [ ] `SyncConflictError`

---

### Phase 5.2: Authentication UI (Week 2)

- [ ] **Sign In Page**
  - [ ] `src/features/auth/pages/SignInPage.tsx`
  - [ ] `src/features/auth/components/SignInForm.tsx`
  - [ ] Email/password form with validation
  - [ ] Social auth buttons (Google, GitHub)
  - [ ] "Forgot password" link

- [ ] **Sign Up Page**
  - [ ] `src/features/auth/pages/SignUpPage.tsx`
  - [ ] `src/features/auth/components/SignUpForm.tsx`
  - [ ] Email verification flow

- [ ] **Password Reset**
  - [ ] `src/features/auth/pages/PasswordResetPage.tsx`
  - [ ] `src/features/auth/components/PasswordResetForm.tsx`

- [ ] **Protected Routes**
  - [ ] `src/features/auth/components/AuthGuard.tsx`
  - [ ] Wrap protected pages (Profile, Edit pages)

- [ ] **Update Navigation**
  - [ ] Add "Sign In" button to MobileNav (when signed out)
  - [ ] Add user avatar to MobileNav (when signed in)
  - [ ] Implement DesktopHeader with auth dropdown
  - [ ] Update AccountSection in SettingsPage

---

### Phase 5.3: Data Model Updates (Week 3)

- [ ] **Update Type Definitions**
  - [ ] Add `userId`, `isPublic`, `sharedWith` to Song type
  - [ ] Add `userId`, `isPublic`, `sharedWith` to Arrangement type
  - [ ] Add `userId`, `isPublic`, `sharedWith` to Setlist type
  - [ ] Update `Database.types.ts` with new stores and indexes

- [ ] **IndexedDB Migration**
  - [ ] Bump database version to 7
  - [ ] Implement migration in `migrations.ts`
  - [ ] Create auth migration script (`authMigration.ts`)
  - [ ] Test migration with existing data

- [ ] **Update Repositories**
  - [ ] Add permission checking to `BaseRepository`
  - [ ] Update `save()` to check permissions
  - [ ] Update `delete()` to check permissions
  - [ ] Update `getAll()` to filter by user access
  - [ ] Add `getByUser()` to SongRepository
  - [ ] Add `getByUser()` to ArrangementRepository
  - [ ] Add `getByUser()` to SetlistRepository

- [ ] **Create UserRepository**
  - [ ] `src/features/auth/db/UserRepository.ts`
  - [ ] Implement `getByEmail()`, `getCurrentUser()`, etc.

---

### Phase 5.4: Sync Implementation (Week 4)

- [ ] **Sync Service**
  - [ ] `src/features/auth/services/syncService.ts`
  - [ ] Implement `syncPendingChanges()`
  - [ ] Implement `syncFromSupabase()`
  - [ ] Implement conflict resolution

- [ ] **Auth Sync Hook**
  - [ ] `src/features/auth/hooks/useAuthSync.ts`
  - [ ] Trigger sync on connection restore
  - [ ] Trigger sync on sign in
  - [ ] Show sync status in UI

- [ ] **Update Sync Queue**
  - [ ] Add `userId` field to SyncQueueItem
  - [ ] Update repository `queueForSync()` method
  - [ ] Filter sync queue by user

- [ ] **Sync Status Indicator**
  - [ ] `src/features/auth/components/SyncStatusBadge.tsx`
  - [ ] Show "Syncing...", "Synced", "Error" states
  - [ ] Add to DesktopHeader

---

### Phase 5.5: Collaboration Features (Week 5)

- [ ] **Sharing UI**
  - [ ] Add "Share" button to SongPage (for owners)
  - [ ] Add "Share" button to SetlistPage (for owners)
  - [ ] Create ShareDialog component
  - [ ] Implement user search/autocomplete

- [ ] **Permissions Hook**
  - [ ] `src/features/auth/hooks/usePermissions.ts`
  - [ ] `canEdit()`, `canDelete()`, `canShare()`

- [ ] **Collaboration Hook**
  - [ ] `src/features/auth/hooks/useCollaboration.ts`
  - [ ] `shareWith()`, `unshareWith()`, `getSharedUsers()`

- [ ] **Shared Resources View**
  - [ ] Add "Shared with Me" filter to SearchPage
  - [ ] Add "Shared" tab to ProfilePage
  - [ ] Show collaborators on SetlistPage

---

### Phase 5.6: Profile Management (Week 6)

- [ ] **Update ProfilePage**
  - [ ] Replace placeholder with real profile UI
  - [ ] Add profile header with avatar
  - [ ] Add edit profile form
  - [ ] Add user stats widget (songs created, setlists, etc.)

- [ ] **Profile Components**
  - [ ] `src/features/profile/components/ProfileHeader.tsx`
  - [ ] `src/features/profile/components/EditProfileForm.tsx`
  - [ ] `src/features/profile/components/UserStatsWidget.tsx`
  - [ ] `src/features/profile/components/RecentActivityFeed.tsx`

- [ ] **Avatar Upload**
  - [ ] Implement avatar upload to Supabase Storage
  - [ ] Add image cropping/resizing
  - [ ] Update user avatar in all locations

---

### Phase 5.7: Testing & Polish (Week 7)

- [ ] **Error Handling**
  - [ ] Test network errors during sync
  - [ ] Test auth errors (invalid credentials, expired tokens)
  - [ ] Test permission errors
  - [ ] Add user-friendly error messages

- [ ] **Offline Scenarios**
  - [ ] Test sign-in offline (should fail gracefully)
  - [ ] Test editing offline (should queue for sync)
  - [ ] Test sync on reconnection
  - [ ] Test conflict resolution

- [ ] **Cross-Device Testing**
  - [ ] Test sync between two devices
  - [ ] Test real-time updates (if implemented)
  - [ ] Test sharing between users

- [ ] **Documentation**
  - [ ] Update CLAUDE.md with Phase 5 completion
  - [ ] Document authentication flow
  - [ ] Document sync architecture
  - [ ] Update README with setup instructions

- [ ] **Validation Gates**
  - [ ] All TypeScript checks pass (`npm run typecheck`)
  - [ ] All linting passes (`npm run lint`)
  - [ ] Production build succeeds (`npm run build`)
  - [ ] PWA audit passes (`npm run pwa:audit`)

---

## Conclusion

The HSA Songbook codebase is **architecturally sound** and **ready for Phase 5 authentication**. The existing patterns provide excellent examples to follow:

✅ **ThemeProvider** → AuthProvider pattern
✅ **BaseRepository** → Permission-aware repository
✅ **useOnlineStatus** → useAuthSync pattern
✅ **Vertical slice architecture** → auth feature module
✅ **TypeScript strict mode** → Type-safe auth implementation

**Key Success Factors**:
1. Follow existing patterns religiously
2. Maintain backward compatibility with optional fields
3. Test offline-first scenarios thoroughly
4. Document all breaking changes
5. Use environment-aware configuration

**Estimated Timeline**: 6-7 weeks for full Phase 5 implementation

**Next Steps**: Begin with Phase 5.1 (Foundation) - Supabase setup and AuthProvider implementation.
