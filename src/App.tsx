import { useEffect } from 'react'
import { InteractiveFilterDisplay } from './components/workspace/InteractiveFilterDisplay'
import { MorphAppDisplay } from './components/workspace/MorphAppDisplay'
import { ModernToolbar } from './components/ui/ModernToolbar'
import { ModernControlPanel } from './components/ui/ModernControlPanel'
import { MobileControlDrawer } from './components/ui/MobileControlDrawer'
import { useStore } from './store'
import './App.css'

function App() {
  const theme = useStore((state) => state.theme)
  const activeFilter = useStore((state) => state.filter.activeFilter)
  
  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <ModernToolbar />
      
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
          {activeFilter?.id === 'morphapp' ? (
            <MorphAppDisplay />
          ) : (
            <InteractiveFilterDisplay />
          )}
        </div>
        
        <ModernControlPanel />
      </main>
      
      <MobileControlDrawer />
    </div>
  )
}

export default App
