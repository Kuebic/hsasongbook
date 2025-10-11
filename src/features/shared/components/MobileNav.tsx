import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, List, Settings } from 'lucide-react'
import { useNavigation } from '../hooks/useNavigation'
import { cn } from '@/lib/utils'
import { getZIndexClass } from '@/lib/config/zIndex'

interface MobileNavProps {
  /**
   * Additional CSS classes to apply to the mobile nav
   */
  className?: string;
}

/**
 * Mobile navigation component
 *
 * Bottom navigation bar for mobile viewports (< 768px).
 * Features:
 * - 4 buttons: Back, Home, Setlists, Settings
 * - 48px touch targets (WCAG 2.5.5 compliance)
 * - Auto-hide on scroll down, reveal on scroll up
 * - Active page highlighting
 * - Touch feedback animation
 *
 * Hidden on desktop viewports (≥ 768px) where DesktopHeader is shown instead.
 */
export default function MobileNav({ className }: MobileNavProps) {
  const { goToSearch, goBack, currentPath, navigate } = useNavigation()
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const [lastScrollY, setLastScrollY] = useState<number>(0)

  useEffect(() => {
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <div
      className={cn(
        // Layout & positioning
        'fixed bottom-0 left-0 right-0',
        // Visual styling
        'bg-background/95 backdrop-blur border-t',
        // Z-index for proper stacking
        getZIndexClass('mobileNav'),
        // Animation
        'transition-transform duration-300',
        // Visibility
        isVisible ? 'translate-y-0' : 'translate-y-full',
        // Responsive (hidden on desktop)
        'md:hidden',
        // Custom classes
        className
      )}
    >
      <div className="flex justify-around items-center p-2">
        {/* Back Button */}
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

        {/* Home Button */}
        <Button
          variant="ghost"
          onClick={goToSearch}
          aria-label="Go to home page"
          aria-current={currentPath === '/' ? 'page' : undefined}
          className={cn(
            'flex-1 h-12 flex-col gap-1',
            'touch-manipulation',
            'active:scale-95',
            'transition-transform',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            currentPath === '/' && 'bg-accent text-accent-foreground'
          )}
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Home</span>
        </Button>

        {/* Setlists Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/setlists')}
          aria-label="View setlists"
          aria-current={currentPath.startsWith('/setlist') ? 'page' : undefined}
          className={cn(
            'flex-1 h-12 flex-col gap-1',
            'touch-manipulation',
            'active:scale-95',
            'transition-transform',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            currentPath.startsWith('/setlist') && 'bg-accent text-accent-foreground'
          )}
        >
          <List className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Sets</span>
        </Button>

        {/* Settings Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          aria-label="Open settings"
          aria-current={currentPath === '/settings' ? 'page' : undefined}
          className={cn(
            'flex-1 h-12 flex-col gap-1',
            'touch-manipulation',
            'active:scale-95',
            'transition-transform',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            currentPath === '/settings' && 'bg-accent text-accent-foreground'
          )}
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">Settings</span>
        </Button>
      </div>
    </div>
  )
}