import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { useEffect } from 'react'
import { SearchPage } from '../features/search'
import { BrowsePage } from '../features/browse'
import { SongPage } from '../features/songs'
import { ArrangementPage } from '../features/arrangements'
import { SetlistsIndexPage, SetlistPage, SetlistPerformancePage, SetlistsBrowsePage } from '../features/setlists'
import { SettingsPage } from '../features/settings'
import { ProfilePage, UserProfilePage } from '../features/profile'
import { GroupsIndexPage, GroupPage, GroupSettingsPage } from '../features/groups'
import SignInPage from '../features/auth/pages/SignInPage'
import SignUpPage from '../features/auth/pages/SignUpPage'
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage'
import { NotFound } from '../features/shared/pages/NotFound'
import ScrollRestoration from '../features/shared/components/ScrollRestoration'
import MobileNav from '../features/shared/components/MobileNav'
import DesktopHeader from '../features/shared/components/DesktopHeader'
import SkipLink from '../features/shared/components/SkipLink'
import { useKeyboardShortcuts } from '../features/shared/hooks/useKeyboardShortcuts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { AlertCircle } from 'lucide-react'
import logger from '@/lib/logger'

// Convex imports
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

// Theme imports
import { ThemeProvider } from '@/lib/theme/ThemeProvider'

// Auth imports
import { AuthProvider } from '../features/auth/context/AuthProvider'

// Appearance imports
import { UserAppearanceProvider } from '../features/appearance'

// Audio imports
import { AudioPlayerProvider, GlobalAudioPlayer } from '../features/audio'

// PWA imports
import { usePWA, UpdateNotification, OfflineIndicator } from '../features/pwa'
import { initDatabase } from '../features/pwa/db/database'

import '../App.css'

// Initialize Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            An unexpected error occurred while loading the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-3">
            <pre className="text-xs overflow-auto">
              {error.message}
            </pre>
          </div>
          <Button onClick={resetErrorBoundary} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function AppWithFeatures() {
  useKeyboardShortcuts()

  // Initialize PWA features
  const { needRefresh, updateServiceWorker } = usePWA()

  // Initialize IndexedDB for local drafts storage only
  // (Songs and arrangements are now stored in Convex)
  useEffect(() => {
    const initializePWA = async () => {
      try {
        // Initialize database for chordproDrafts only
        await initDatabase()
        logger.info('Local storage initialized for drafts')
      } catch (error) {
        logger.error('Failed to initialize PWA features:', error)
      }
    }

    initializePWA()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Accessibility: Skip to main content link */}
      <SkipLink />

      {/* Desktop Navigation Header (hidden on mobile) */}
      <DesktopHeader className="hidden md:block" />

      {/* Scroll Restoration */}
      <ScrollRestoration />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/songs" element={<BrowsePage />} />
          <Route path="/song/:songSlug" element={<SongPage />} />
          <Route path="/song/:songSlug/:arrangementSlug" element={<ArrangementPage />} />
          <Route path="/setlists" element={<SetlistsIndexPage />} />
          <Route path="/setlists/browse" element={<SetlistsBrowsePage />} />
          <Route path="/setlist/:setlistId" element={<SetlistPage />} />
          <Route path="/setlist/:setlistId/performance/:arrangementIndex?" element={<SetlistPerformancePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/user/:username" element={<UserProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Groups routes (Phase 2: Groups & Permissions) */}
          <Route path="/groups" element={<GroupsIndexPage />} />
          <Route path="/groups/:groupSlug" element={<GroupPage />} />
          <Route path="/groups/:groupSlug/settings" element={<GroupSettingsPage />} />
          {/* Auth routes (Phase 5) */}
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/signup" element={<SignUpPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Mobile Navigation (hidden on desktop) */}
      <MobileNav className="md:hidden" />

      {/* Global Audio Player - persists across page navigation */}
      <GlobalAudioPlayer />

      {/* PWA UI Components */}
      <OfflineIndicator />
      {needRefresh && (
        <UpdateNotification
          onUpdate={updateServiceWorker}
        />
      )}

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <ConvexAuthProvider client={convex}>
      <ThemeProvider defaultTheme="system" storageKey="hsasongbook-theme">
        <AuthProvider>
          <UserAppearanceProvider>
            <AudioPlayerProvider>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => {
                // Reset app state if needed
                window.location.href = '/'
              }}
            >
              <BrowserRouter>
                <AppWithFeatures />
              </BrowserRouter>
            </ErrorBoundary>
          </AudioPlayerProvider>
          </UserAppearanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </ConvexAuthProvider>
  )
}

export default App
