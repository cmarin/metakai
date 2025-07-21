import { useEffect } from 'react'
import { Canvas } from './components/workspace/Canvas'
import { Toolbar } from './components/ui/Toolbar'
import { ControlPanel } from './components/ui/ControlPanel'
import { ZoomControls } from './components/workspace/ZoomControls'
import { useStore } from './store'
import './App.css'

function App() {
  const theme = useStore((state) => state.theme)
  
  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])
  
  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        useStore.getState().toggleTheme()
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    // Set initial theme based on system preference
    if (mediaQuery.matches) {
      useStore.getState().toggleTheme()
    }
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <Canvas />
          <ZoomControls />
        </div>
        
        <ControlPanel />
      </div>
    </div>
  )
}

export default App
