import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { arrayMove } from '@dnd-kit/sortable'
import TodoList from './components/TodoList'
import Analytics from './components/Analytics'
import Settings from './components/Settings'

function App() {
  const [activeTab, setActiveTab] = useState('todos')
  const [isInitialized, setIsInitialized] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  
  // State management
  const [todos, setTodos] = useState([])
  const [categories, setCategories] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Initialize data
  useEffect(() => {
    // Don't attempt to load data if we're already initialized
    if (isInitialized) {
      return
    }

    try {
      console.log("Initializing app data")
      loadFromLocalStorage()
      
      // Mark as initialized even if no data is found
      setIsInitialized(true)
    } catch (error) {
      console.error("Error during initialization:", error)
      setIsInitialized(true) // Still mark as initialized to prevent lockup
    }
  }, [])

  // Data persistence functions
  const saveToLocalStorage = () => {
    try {
      // Don't save if we haven't initialized yet
      if (!isInitialized) {
        console.log('Skipping save - not yet initialized')
        return false
      }

      const todosJson = JSON.stringify(todos)
      const categoriesJson = JSON.stringify(categories)
      const settingsJson = JSON.stringify({ darkMode })
      
      console.log('Saving to localStorage')
      
      localStorage.setItem('todos', todosJson)
      localStorage.setItem('categories', categoriesJson)
      localStorage.setItem('settings', settingsJson)
      
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      setStatusMessage("Error saving data")
      setTimeout(() => setStatusMessage(""), 3000)
      return false
    }
  }

  const loadFromLocalStorage = () => {
    try {
      console.log("Loading from localStorage")
      
      const savedTodos = localStorage.getItem('todos')
      const savedCategories = localStorage.getItem('categories')
      const savedSettings = localStorage.getItem('settings')
      
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos))
      }
      
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories))
      }
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        if (settings.darkMode !== undefined) {
          setDarkMode(settings.darkMode)
        }
      }
      
      return true
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return false
    }
  }

  // Auto-save effect
  useEffect(() => {
    // Only save if initialization is complete
    if (!isInitialized) {
      console.log("Skipping auto-save - not yet initialized")
      return
    }

    // Use a timeout to avoid saving during render cycles
    const saveTimeout = setTimeout(() => {
      console.log("Auto-saving changes")
      saveToLocalStorage()
    }, 500)
    
    return () => clearTimeout(saveTimeout)
  }, [todos, categories, darkMode, isInitialized])

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])
  
  // Set custom favicon
  useEffect(() => {
    // Create an SVG favicon that adapts to dark/light mode
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="${darkMode ? '#242424' : '#fdfdfa'}"/>
        <rect x="16" y="20" width="32" height="6" rx="2" fill="${darkMode ? '#4b7cb3' : '#2e4057'}"/>
        <rect x="16" y="30" width="24" height="6" rx="2" fill="${darkMode ? '#6b7275' : '#939b9f'}"/>
        <rect x="16" y="40" width="28" height="6" rx="2" fill="${darkMode ? '#8a9a5b' : '#8a9a5b'}"/>
      </svg>
    `
    
    // Convert SVG to base64 data URL
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString.trim())}`
    
    // Check if favicon already exists
    let link = document.querySelector("link[rel*='icon']")
    
    // Create new link element if it doesn't exist
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    
    // Set the href of the link to our data URL
    link.href = dataUrl
    
    // Also update the document title
    document.title = 'Tasks | Minimal Todo App'
  }, [darkMode])

  // Update current time every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(intervalId)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(prevDarkMode => !prevDarkMode)
  }

  const addTodo = (text, category) => {
    if (category && !categories.includes(category)) {
      setCategories([...categories, category])
    }

    setTodos([
      ...todos,
      {
        id: Date.now(),
        text,
        category: category || null,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
      }
    ])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        return {
          ...todo,
          completed: !todo.completed,
          completedAt: !todo.completed ? new Date().toISOString() : null
        }
      }
      return todo
    }))
  }
  
  const updateTodo = (id, text) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        return {
          ...todo,
          text
        }
      }
      return todo
    }))
  }
  
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  // Data export function for Settings
  const exportData = () => {
    return {
      todos,
      categories,
      settings: { darkMode }
    }
  }

  // Data import function for Settings
  const importData = (data) => {
    try {
      if (data.todos && Array.isArray(data.todos)) {
        setTodos(data.todos)
      }
      
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories)
      }
      
      if (data.settings && typeof data.settings === 'object') {
        const { darkMode: importedDarkMode } = data.settings
        if (importedDarkMode !== undefined) {
          setDarkMode(importedDarkMode)
        }
      }
      
      // Save the imported data
      setTimeout(() => saveToLocalStorage(), 0)
      
      return true
    } catch (error) {
      console.error('Import data error:', error)
      return false
    }
  }

  // Format current time
  const formattedDate = format(currentTime, 'EEEE, MMMM d')
  const formattedTime = format(currentTime, 'h:mm a')

  // New function to handle drag end event
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        // Use arrayMove to update the order
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="app"> 
      <header className="header"> 
        <div className="header-top">
          <h1>Tasks</h1>
          <div className="header-actions">
            <button 
              onClick={toggleDarkMode}
              className="theme-toggle"
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <div className="date-display">
              <span className="date">{formattedDate}</span>
              <span className="time">{formattedTime}</span>
            </div>
          </div>
        </div>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            Tasks
          </button>
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </header>
      
        {statusMessage && <div className="status-message">{statusMessage}</div>}
      
      {activeTab === 'todos' ? (
          <TodoList 
            todos={todos} 
            toggleTodo={toggleTodo} 
            addTodo={addTodo} 
            updateTodo={updateTodo}
            deleteTodo={deleteTodo}
            categories={categories}
            handleDragEnd={handleDragEnd}
          />
      ) : activeTab === 'analytics' ? (
        <Analytics todos={todos} categories={categories} />
      ) : (
          <Settings 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode} 
            exportData={exportData}
            importData={importData}
            saveToLocalStorage={saveToLocalStorage}
            loadFromLocalStorage={loadFromLocalStorage}
          />
        )}
      
      <footer className="footer">
        <div className="counts">
          <span>{todos.length} tasks</span>
          <span>{todos.filter(todo => todo.completed).length} completed</span>
        </div>
      </footer>
    </div>
  )
}

export default App