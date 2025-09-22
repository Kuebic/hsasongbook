import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Don't trigger if typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return
      }

      // Keyboard shortcuts
      switch(event.key) {
        case '/':
          // Focus search on home page
          event.preventDefault()
          navigate('/')
          setTimeout(() => {
            const searchInput = document.querySelector('input[type="search"]')
            if (searchInput) searchInput.focus()
          }, 100)
          break

        case 'Escape':
          // Go back
          navigate(-1)
          break

        case 'h':
          // Go home
          if (event.metaKey || event.ctrlKey) {
            event.preventDefault()
            navigate('/')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigate])
}