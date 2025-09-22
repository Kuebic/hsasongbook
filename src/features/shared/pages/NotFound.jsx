import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Search className="mr-2 h-4 w-4" />
            Search Songs
          </Button>
        </div>
      </div>
    </div>
  )
}