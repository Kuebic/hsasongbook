# Token Refresh Strategies for Offline-First PWAs

**Research Date:** October 14, 2025
**Context:** Phase 5 (Cloud Integration) - Supabase Authentication Planning
**Focus:** Offline token handling, automatic refresh, and security/UX trade-offs

---

## Executive Summary

Token refresh in offline-first Progressive Web Apps (PWAs) requires balancing security, user experience, and technical constraints. The core challenge is maintaining user authentication during network interruptions while protecting against token theft and ensuring seamless re-synchronization when connectivity returns.

**Key Findings:**
- **Offline Authentication Pattern**: Keep users "logged in" locally using refresh tokens from prior online sessions
- **Automatic Refresh**: Use event-driven token refresh (onAuthStateChange) rather than manual setInterval polling
- **Security Trade-off**: localStorage is vulnerable to XSS but necessary for offline persistence
- **Supabase Auto-Refresh**: Built-in token refresh with configurable retry logic and background refresh
- **Graceful Degradation**: Time-limited offline access with forced re-authentication after expiry

---

## 1. Offline Token Handling

### Industry Best Practices

**Offline Authentication Strategy:**
The consensus approach for offline-first PWAs is to **assume authentication remains valid while offline** if the user has a previously established session with a valid refresh token. This means:

1. **User remains "logged in" locally** during network interruptions
2. **Refresh token acts as proof of prior authentication**
3. **Access token expiry is deferred** until connectivity returns
4. **Queued operations** (writes, edits) are stored in IndexedDB and replayed after token refresh

**When to Force Sign-Out:**
- **Time-based expiry**: Implement app-level validation that limits offline usage duration (e.g., 7-30 days)
- **Refresh token expiry**: If refresh token expires while offline, force re-authentication when online
- **Security breach**: If user explicitly signs out or revokes access from another device

**When to Retry vs Sign-Out:**
- **Network errors**: Retry token refresh automatically (Supabase does this every 10 seconds)
- **401 Unauthorized**: Refresh token expired or revoked → force sign-out
- **Other errors**: Retry with exponential backoff, max 3-5 attempts

### Security Considerations

**Offline Trust Limitations:**
> "Without internet, you really can't trust who the user is in the application."

This is a fundamental security limitation. Offline authentication is inherently less secure because:
- **No real-time validation** against the auth server
- **Token revocation cannot be enforced** until the device reconnects
- **Stolen devices** remain authenticated until token expiry

**Mitigation Strategies:**
1. **Short offline window**: Limit offline authentication to 7-14 days max
2. **Device fingerprinting**: Store device-specific metadata to detect anomalies
3. **Sensitive operations**: Require re-authentication for critical actions (e.g., profile changes, payment)
4. **Audit trail**: Log all offline operations for later reconciliation

---

## 2. Automatic Token Refresh

### Supabase-Specific Patterns

**Built-in Auto-Refresh:**
Supabase clients automatically handle token refresh using a background timer that:
- **Checks session every few seconds** (configurable interval)
- **Starts refresh process close to expiration** (default: 5 minutes before expiry)
- **Retries indefinitely** if refresh fails due to network errors
- **Stores tokens in localStorage** (browser) or AsyncStorage (React Native)

**onAuthStateChange Event-Driven Pattern:**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,        // Enable automatic refresh
    persistSession: true,           // Persist session in storage
    detectSessionInUrl: false,      // Disable URL-based session detection (PWA)
    storage: window.localStorage,   // Use localStorage (or AsyncStorage for mobile)
  },
})

// Listen for authentication events (including token refresh)
const { data } = supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'INITIAL_SESSION':
      // Handle initial session load (app startup)
      console.log('Session restored from storage', session)
      break

    case 'SIGNED_IN':
      // User signed in (initial login)
      console.log('User signed in', session.user)
      break

    case 'TOKEN_REFRESHED':
      // Access token was automatically refreshed
      console.log('Token refreshed', session.access_token)
      // This is where you'd sync queued operations from IndexedDB
      break

    case 'SIGNED_OUT':
      // User signed out or token expired
      console.log('User signed out')
      // Clear local cache and redirect to login
      break

    case 'USER_UPDATED':
      // User profile updated
      console.log('User updated', session.user)
      break
  }
})

// Cleanup: Unsubscribe when component unmounts
data.subscription.unsubscribe()
```

**Mobile/PWA-Specific Auto-Refresh (React Native Example):**

```javascript
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Start/stop auto-refresh based on app state (mobile-specific)
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()  // Resume refresh when app is foregrounded
  } else {
    supabase.auth.stopAutoRefresh()   // Pause refresh when app is backgrounded
  }
})
```

**For PWAs in browser:** The library automatically detects tab focus and starts/stops refresh accordingly. Manual control is **not needed** for web PWAs.

### Refresh Token vs Access Token Lifetimes

**Standard OAuth2/Supabase Token Lifetimes:**
- **Access Token**: 5 minutes to 1 hour (Supabase default: 1 hour)
- **Refresh Token**: Long-lived or never expires (Supabase: single-use but perpetually rotating)

**Supabase Refresh Token Rotation:**
Supabase uses **automatic refresh token rotation**:
1. Each refresh token can only be used **once**
2. When used, it returns a **new access token + new refresh token**
3. Old refresh token is **immediately invalidated**
4. This prevents replay attacks and limits damage from stolen tokens

### Handling Refresh Failures

**Network Errors (Offline):**
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && !navigator.onLine) {
    // Token expired while offline - keep user "logged in" locally
    // Store a flag to force refresh when back online
    localStorage.setItem('pending_token_refresh', 'true')

    // Continue showing cached data, but disable writes
    store.dispatch({ type: 'SET_READ_ONLY_MODE', payload: true })
  }
})

// When connectivity returns
window.addEventListener('online', async () => {
  if (localStorage.getItem('pending_token_refresh')) {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      // Refresh token expired - force sign-out
      await supabase.auth.signOut()
      window.location.href = '/login'
    } else {
      // Success - sync queued operations
      localStorage.removeItem('pending_token_refresh')
      store.dispatch({ type: 'SET_READ_ONLY_MODE', payload: false })
      await syncQueuedOperations()
    }
  }
})
```

**Expired Refresh Tokens:**
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && session === null) {
    // Check if this is a network error or actual token expiry
    fetch('https://www.google.com/generate_204', { mode: 'no-cors' })
      .then(() => {
        // Online - refresh token is actually expired
        console.log('Refresh token expired - redirecting to login')
        window.location.href = '/login'
      })
      .catch(() => {
        // Offline - assume token is still valid locally
        console.log('Offline - keeping user logged in locally')
      })
  }
})
```

---

## 3. Security vs UX Trade-offs

### Refresh Token Rotation

**What is Refresh Token Rotation?**
Refresh token rotation is the practice of issuing a **new refresh token every time an access token is requested**. The old refresh token is immediately invalidated.

**Security Benefits:**
- **Limits token theft impact**: Stolen refresh tokens become useless after one use
- **Detects token theft**: If a token is used twice (legitimate user + attacker), both are logged out
- **Forces re-authentication**: After detection, both parties must sign in again

**Supabase Implementation:**
Supabase enables refresh token rotation **by default**. No configuration needed.

### Storage Security: localStorage vs Memory vs Cookies

**Option 1: localStorage (Most Common for PWAs)**
```javascript
// Supabase default
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,  // Persistent across tabs/reloads
    persistSession: true,
  },
})
```

**Pros:**
- ✅ Persists across page refreshes and browser restarts
- ✅ Required for offline-first PWAs (works when JavaScript is disabled)
- ✅ Shares session across tabs

**Cons:**
- ❌ **Vulnerable to XSS attacks** (JavaScript can read localStorage)
- ❌ No expiration mechanism (stays until manually deleted)

**Mitigation:**
- Use Content Security Policy (CSP) to prevent script injection
- Sanitize all user-generated content
- Regularly audit dependencies for XSS vulnerabilities

**Option 2: Memory-Only (Most Secure, Not Offline-Compatible)**
```javascript
// Custom in-memory storage (not built-in to Supabase)
const inMemoryStorage = {
  getItem: (key) => memoryStore[key] || null,
  setItem: (key, value) => { memoryStore[key] = value },
  removeItem: (key) => { delete memoryStore[key] },
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: inMemoryStorage,
    persistSession: false,  // Do not persist
  },
})
```

**Pros:**
- ✅ **Immune to XSS** (tokens cleared on page reload)
- ✅ Most secure option

**Cons:**
- ❌ **Not offline-compatible** (tokens lost on page refresh)
- ❌ User must re-authenticate after every reload
- ❌ Does not work across tabs

**Use Case:** Admin panels, banking apps, or high-security applications where offline is not required.

**Option 3: HttpOnly Cookies (Best Security, Requires Backend)**
```javascript
// Requires server-side implementation (not built-in to Supabase client)
// Supabase Auth Helpers (Next.js, SvelteKit, etc.) use this pattern

// Example with Next.js App Router
import { createServerClient } from '@supabase/ssr'

export const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      get: (name) => cookies().get(name)?.value,
      set: (name, value, options) => cookies().set(name, value, options),
    },
  }
)
```

**Pros:**
- ✅ **Protected from XSS** (JavaScript cannot access HttpOnly cookies)
- ✅ **CSRF protection** (SameSite=strict attribute)
- ✅ Persistent across reloads

**Cons:**
- ❌ **Requires backend** (server-side token management)
- ❌ More complex setup (SSR or API proxy)
- ❌ Limited offline support (depends on service worker implementation)

**Use Case:** Server-side rendered (SSR) applications with a backend (Next.js, Remix, SvelteKit).

**Recommendation for HSA Songbook (Client-Only PWA):**
Use **localStorage** with the following safeguards:
1. Implement strict Content Security Policy (CSP)
2. Sanitize all user-generated content (ChordPro lyrics, song titles)
3. Add time-limited offline access (e.g., 14 days)
4. Monitor for token theft (log refresh failures)

### Silent Authentication Flows

**What is Silent Authentication?**
Silent authentication (also called "silent refresh") is the process of refreshing tokens **without user interaction** (no login screen).

**Supabase Implementation:**
Supabase handles silent authentication **automatically** via `autoRefreshToken: true`. When the access token is close to expiry, the client:
1. Sends the refresh token to `/auth/v1/token?grant_type=refresh_token`
2. Receives new access token + new refresh token
3. Emits `TOKEN_REFRESHED` event via `onAuthStateChange`
4. Updates localStorage/AsyncStorage

**No manual implementation needed** - Supabase handles this out of the box.

**For Offline-First Apps:**
When the app comes back online after offline period:

```javascript
window.addEventListener('online', async () => {
  // Force an immediate session refresh
  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    // Refresh token expired - sign out and redirect to login
    await supabase.auth.signOut()
    router.push('/login?reason=session_expired')
  } else {
    // Success - session refreshed silently
    console.log('Session refreshed after coming online', data.session)

    // Sync queued operations from IndexedDB
    await syncOfflineChanges()
  }
})
```

---

## 4. Recommended Implementation for HSA Songbook (Phase 5)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         React App                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐       ┌──────────────────────┐        │
│  │ AuthProvider   │◄──────┤ onAuthStateChange    │        │
│  │ (React Context)│       │ (Event Listener)     │        │
│  └────────┬───────┘       └──────────────────────┘        │
│           │                                                 │
│           │ ┌────────────────────────────────────────┐    │
│           ├─┤ SIGNED_IN → Store user, enable sync   │    │
│           │ └────────────────────────────────────────┘    │
│           │                                                 │
│           │ ┌────────────────────────────────────────┐    │
│           ├─┤ TOKEN_REFRESHED → Sync queued ops     │    │
│           │ └────────────────────────────────────────┘    │
│           │                                                 │
│           │ ┌────────────────────────────────────────┐    │
│           └─┤ SIGNED_OUT → Clear cache, redirect    │    │
│             └────────────────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   Local Data Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐       ┌────────────────────┐        │
│  │  IndexedDB       │       │  Sync Queue        │        │
│  │  - Songs         │◄──────┤  - Pending writes  │        │
│  │  - Arrangements  │       │  - Conflicts       │        │
│  │  - Setlists      │       │  - User ID         │        │
│  └──────────────────┘       └────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Network Available
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐       ┌────────────────────┐        │
│  │  Supabase Auth   │       │  Postgres Database │        │
│  │  - JWT tokens    │       │  - User songs      │        │
│  │  - Refresh tokens│       │  - User setlists   │        │
│  └──────────────────┘       └────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Configuration

**File: `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,          // Enable automatic token refresh
    persistSession: true,             // Persist session in localStorage
    detectSessionInUrl: false,        // Disable URL-based session detection (not needed for PWA)
    storage: window.localStorage,     // Use localStorage for offline support
    storageKey: 'hsa-songbook-auth', // Custom key (avoid conflicts)
  },
})

// Initialize auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  logger.info('Auth event:', event, session?.user?.email)

  switch (event) {
    case 'INITIAL_SESSION':
      // App startup - session restored from localStorage
      if (session) {
        logger.info('Session restored for user:', session.user.email)
      }
      break

    case 'SIGNED_IN':
      // User signed in - initial login
      logger.info('User signed in:', session?.user.email)
      break

    case 'TOKEN_REFRESHED':
      // Token automatically refreshed
      logger.debug('Token refreshed for user:', session?.user.email)

      // If we were offline and now online, sync queued operations
      if (navigator.onLine) {
        window.dispatchEvent(new CustomEvent('sync-queued-operations'))
      }
      break

    case 'SIGNED_OUT':
      // User signed out or token expired
      logger.info('User signed out')

      // Clear IndexedDB cache (user-specific data)
      window.dispatchEvent(new CustomEvent('clear-user-cache'))
      break

    case 'USER_UPDATED':
      // User profile updated
      logger.info('User updated:', session?.user.email)
      break
  }
})
```

### Offline Token Handling Strategy

**File: `src/features/auth/hooks/useAuthState.ts`**

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import logger from '@/lib/logger'

export function useAuthState() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastTokenRefresh, setLastTokenRefresh] = useState<Date | null>(null)
  const [offlineModeDays, setOfflineModeDays] = useState(0)

  const MAX_OFFLINE_DAYS = 14 // Force re-auth after 14 days offline

  useEffect(() => {
    // Track online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      logger.info('App back online - attempting token refresh')

      // Force a session refresh when back online
      supabase.auth.refreshSession().then(({ data, error }) => {
        if (error) {
          logger.error('Token refresh failed after coming online:', error)

          // Refresh token expired - force sign out
          if (error.status === 401) {
            supabase.auth.signOut()
            window.location.href = '/login?reason=session_expired'
          }
        } else {
          logger.info('Token refreshed successfully after coming online')
          setLastTokenRefresh(new Date())
          setOfflineModeDays(0)
        }
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      logger.warn('App went offline - token refresh paused')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    // Check offline duration daily
    const interval = setInterval(() => {
      if (!isOnline) {
        const daysSinceLastRefresh = lastTokenRefresh
          ? Math.floor((Date.now() - lastTokenRefresh.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        setOfflineModeDays(daysSinceLastRefresh)

        // Force sign-out if offline too long
        if (daysSinceLastRefresh > MAX_OFFLINE_DAYS) {
          logger.warn(`Offline for ${daysSinceLastRefresh} days - forcing sign out`)
          supabase.auth.signOut()
          window.location.href = '/login?reason=offline_too_long'
        }
      }
    }, 1000 * 60 * 60 * 24) // Check daily

    return () => clearInterval(interval)
  }, [isOnline, lastTokenRefresh])

  return {
    isOnline,
    offlineModeDays,
    maxOfflineDays: MAX_OFFLINE_DAYS,
  }
}
```

### UX Recommendations

**1. Offline Indicator with Token Status**

```typescript
// src/features/pwa/components/OfflineIndicator.tsx
export function OfflineIndicator() {
  const { isOnline, offlineModeDays, maxOfflineDays } = useAuthState()

  if (isOnline) return null

  const daysRemaining = maxOfflineDays - offlineModeDays

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
      <div className="flex items-center">
        <WifiOff className="h-5 w-5 text-yellow-700 mr-2" />
        <div>
          <p className="text-sm text-yellow-700 font-medium">
            You're offline
          </p>
          <p className="text-xs text-yellow-600">
            Your changes will sync when you reconnect.
            You have {daysRemaining} days remaining before re-authentication is required.
          </p>
        </div>
      </div>
    </div>
  )
}
```

**2. Token Refresh Notification**

```typescript
// Show subtle notification when token refreshes (optional)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Optional: Show a subtle toast
    toast.success('Session refreshed', { duration: 2000 })
  }
})
```

**3. Session Expiry Warning**

```typescript
// Warn user when session is about to expire (if offline > 12 days)
useEffect(() => {
  if (offlineModeDays > 12) {
    toast.warning(
      `You've been offline for ${offlineModeDays} days. Please reconnect within ${maxOfflineDays - offlineModeDays} days to avoid losing access.`,
      { duration: 10000 }
    )
  }
}, [offlineModeDays])
```

---

## 5. Key Takeaways

### Security

1. **Use localStorage for PWA** (no alternative for offline persistence)
2. **Enable refresh token rotation** (Supabase does this by default)
3. **Implement Content Security Policy** (CSP) to mitigate XSS
4. **Time-limit offline access** (14 days recommended)
5. **Monitor for token theft** (log suspicious refresh failures)

### UX

1. **Keep users logged in while offline** (don't force sign-out during network blips)
2. **Show offline indicator** with remaining time before forced re-auth
3. **Auto-sync when back online** (trigger after `TOKEN_REFRESHED` event)
4. **Graceful degradation** (allow read-only access if token expired but offline)
5. **Clear error messages** (distinguish between network errors vs expired tokens)

### Implementation

1. **Use `onAuthStateChange`** (event-driven, not polling)
2. **Enable `autoRefreshToken: true`** (Supabase handles refresh automatically)
3. **Force refresh when back online** (`supabase.auth.refreshSession()`)
4. **Queue operations in IndexedDB** (sync after token refresh)
5. **Test offline scenarios** (disconnect network in DevTools)

---

## 6. Additional Resources

### Official Documentation
- [Supabase Auth Sessions](https://supabase.com/docs/guides/auth/sessions)
- [Supabase JavaScript API - onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
- [Supabase Server-Side Auth (Advanced)](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

### Community Resources
- [Auth0: Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/use-refresh-token-rotation)
- [Stack Overflow: PWA Offline Authentication](https://stackoverflow.com/questions/54748282/how-to-handle-authentication-when-user-is-offline-using-angular-pwa)
- [Dev.to: PWA Authentication Best Practices](https://dev.to/azure/27-best-practices-for-pwa-authentication-29md)

### Security Guidelines
- [OWASP: Token Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-storage-on-client-side)
- [Auth0: Token Storage Best Practices](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)

---

**Next Steps for HSA Songbook (Phase 5):**
1. Implement `AuthProvider` with `onAuthStateChange` listener
2. Add offline token expiry check (14-day limit)
3. Create `useAuthState` hook for online/offline tracking
4. Update `OfflineIndicator` to show remaining offline time
5. Implement sync queue that triggers after `TOKEN_REFRESHED` event
6. Add Content Security Policy headers (Vite plugin or meta tag)
7. Test offline scenarios (DevTools → Network → Offline)