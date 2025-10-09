import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'
import { useNavigation } from '../hooks/useNavigation'
import { cn } from '@/lib/utils'

export default function MobileNav() {
  const { goToSearch, goBack, currentPath } = useNavigation()
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

  // Don't show on home page
  if (currentPath === '/') return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t md:hidden transition-transform duration-300 z-50",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex justify-around items-center p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="flex-1"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="ml-2 text-xs">Back</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToSearch}
          className="flex-1"
        >
          <Home className="h-5 w-5" />
          <span className="ml-2 text-xs">Home</span>
        </Button>
      </div>
    </div>
  )
}