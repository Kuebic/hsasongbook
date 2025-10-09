import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { useEffect } from 'react'
import { SearchPage } from '../features/search'
import { SongPage } from '../features/songs'
import { ArrangementPage } from '../features/arrangements'
import { SetlistsIndexPage, SetlistPage, SetlistPerformancePage } from '../features/setlists'
import { NotFound } from '../features/shared/pages/NotFound'
import ScrollRestoration from '../features/shared/components/ScrollRestoration'
import MobileNav from '../features/shared/components/MobileNav'
import { useKeyboardShortcuts } from '../features/shared/hooks/useKeyboardShortcuts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import logger from '@/lib/logger'

// PWA imports
import { usePWA, UpdateNotification, OfflineIndicator } from '../features/pwa'
import { initDatabase } from '../features/pwa/db/database'
import { importMockData } from '../features/pwa/db/dataMigration'

import '../App.css'

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

  // Initialize database and migrate mock data on first load
  useEffect(() => {
    const initializePWA = async () => {
      try {
        // Initialize database
        const db = await initDatabase()

        // Check if this is first run (no data in DB)
        const songs = await db.getAll('songs')
        if (songs.length === 0) {
          logger.info('First run detected, migrating mock data...')
          await importMockData()
        }
      } catch (error) {
        logger.error('Failed to initialize PWA features:', error)
      }
    }

    initializePWA()
  }, [])

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

      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/song/:songId" element={<SongPage />} />
        <Route path="/arrangement/:arrangementId" element={<ArrangementPage />} />
        <Route path="/setlists" element={<SetlistsIndexPage />} />
        <Route path="/setlist/:setlistId" element={<SetlistPage />} />
        <Route path="/setlist/:setlistId/performance/:arrangementIndex?" element={<SetlistPerformancePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

function App() {
  return (
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
  )
}

export default App
