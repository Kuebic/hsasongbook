import React from 'react'

interface SimplePageTransitionProps {
  children: React.ReactNode
}

// Simple CSS-based page transition for MVP (no framer-motion dependency)
export function SimplePageTransition({ children }: SimplePageTransitionProps) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {children}
    </div>
  )
}

export default SimplePageTransition