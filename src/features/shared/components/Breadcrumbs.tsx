import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Breadcrumb } from '../hooks/useNavigation'

interface BreadcrumbsProps {
  items?: Breadcrumb[]
  className?: string
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm", className)}
    >
      {/* Home link */}
      <Link
        to="/"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={item.path || index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-none"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}