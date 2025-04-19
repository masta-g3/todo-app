import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { getTagColor } from '../utils/colorUtils'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core'
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// New component for individual sortable todo items
const SortableTodoItem = ({ todo, toggleTodo, updateTodo, deleteTodo, setEditingTodoId, setEditText, editingTodoId, editText, editInputRef, getRelativeTime, startPomodoro, categories }) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition 
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li 
      ref={setNodeRef}
      style={style}
      key={todo.id} 
      className={`todo-item ${todo.completed ? 'completed' : ''} ${editingTodoId === todo.id ? 'editing' : ''}`}
    >
      <div className="drag-handle" {...attributes} {...listeners}>⠿</div> {/* Simple drag handle */} 
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        id={`todo-${todo.id}`}
      />
      <div className="todo-content">
        {editingTodoId === todo.id ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              if (editText.trim()) {
                updateTodo(todo.id, editText.trim())
                setEditingTodoId(null)
              }
            }}
            className="todo-edit-form"
          >
            <input
              ref={editInputRef}
              type="text"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={() => {
                if (editText.trim()) {
                  updateTodo(todo.id, editText.trim())
                }
                setEditingTodoId(null)
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setEditingTodoId(null)
                }
              }}
              className="todo-edit-input"
            />
          </form>
        ) : (
          <label 
            htmlFor={`todo-${todo.id}`} 
            className="todo-text"
            onDoubleClick={() => {
              setEditingTodoId(todo.id)
              setEditText(todo.text)
            }}
          >
            {todo.text}
          </label>
        )}
        <div className="todo-meta">
          <span className="todo-date">
            {getRelativeTime(todo.createdAt)}
          </span>
          
          {todo.category && (
            <span 
              className="todo-tag"
              style={{ backgroundColor: getTagColor(todo.category, categories) }}
            >
              {todo.category}
            </span>
          )}
          
          {!editingTodoId && (
            <>
              {!todo.completed && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingTodoId(todo.id)
                    setEditText(todo.text)
                  }}
                  className="todo-edit-button"
                  title="Edit task"
                >
                  ✎
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Are you sure you want to delete this task?')) {
                    deleteTodo(todo.id)
                  }
                }}
                className="todo-delete-button"
                title="Delete task"
              >
                ×
              </button>
              {!todo.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    startPomodoro(todo.id)
                  }}
                  className="todo-pomodoro-button"
                  title="Start 25‑minute timer"
                  style={{ marginLeft: '4px' }}
                >
                  {/* simple tomato-like circle icon */}
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="6" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  )
}

const TodoList = ({ todos, toggleTodo, addTodo, updateTodo, deleteTodo, categories, handleDragEnd }) => {
  const [newTodo, setNewTodo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [editingTodoId, setEditingTodoId] = useState(null)
  const [editText, setEditText] = useState('')
  // Pomodoro state
  const [pomodoroEnd, setPomodoroEnd] = useState(null) // timestamp in ms
  const [pomodoroRemaining, setPomodoroRemaining] = useState(0) // seconds remaining
  const inputRef = useRef(null)
  const newCategoryRef = useRef(null)
  const editInputRef = useRef(null)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Focus new category input when adding a new category
  useEffect(() => {
    if (isAddingNewCategory && newCategoryRef.current) {
      newCategoryRef.current.focus()
    }
  }, [isAddingNewCategory])
  
  // Focus edit input when editing a task
  useEffect(() => {
    if (editingTodoId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTodoId])

  // Pomodoro countdown effect
  useEffect(() => {
    if (!pomodoroEnd) return

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((pomodoroEnd - Date.now()) / 1000))
      setPomodoroRemaining(diff)

      if (diff === 0) {
        clearInterval(interval)
        setPomodoroEnd(null)
        alert('Time is up!')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [pomodoroEnd])

  const startPomodoro = (todoId) => {
    setPomodoroEnd(Date.now() + 25 * 60 * 1000) // 25 minutes
  }

  const stopPomodoro = () => {
    setPomodoroEnd(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newTodo.trim() === '') return
    
    let categoryToUse = selectedCategory
    
    // Handle new category
    if (isAddingNewCategory && newCategory.trim()) {
      categoryToUse = newCategory.trim()
    }
    
    addTodo(newTodo.trim(), categoryToUse || null)
    setNewTodo('')
    setSelectedCategory('')
    setIsAddingNewCategory(false)
    setNewCategory('')
    
    // Refocus the input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleCategoryChange = (e) => {
    const value = e.target.value
    if (value === 'new') {
      setIsAddingNewCategory(true)
      setSelectedCategory('')
    } else {
      setIsAddingNewCategory(false)
      setSelectedCategory(value)
    }
  }

  // Format relative time
  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp)
    return format(date, 'MMM d')
  }

  return (
    <div>
      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
        />
        
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          <option value="new">+ New category</option>
        </select>
        
        {isAddingNewCategory && (
          <input
            ref={newCategoryRef}
            type="text"
            value={newCategory}
            placeholder="New category name"
            onChange={(e) => setNewCategory(e.target.value)}
          />
        )}
        
        <button type="submit">Add Task</button>
      </form>

      {/* Wrap list with DndContext and SortableContext */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd} // Use the handler from props
      >
        <SortableContext 
          items={todos.map(todo => todo.id)} // Pass IDs for tracking
          strategy={verticalListSortingStrategy}
        >
          <ul className="todos-list">
            {/* Map over todos directly and use SortableTodoItem */}
            {todos.map((todo) => (
              <SortableTodoItem 
                key={todo.id}
                todo={todo}
                toggleTodo={toggleTodo}
                updateTodo={updateTodo}
                deleteTodo={deleteTodo}
                setEditingTodoId={setEditingTodoId}
                setEditText={setEditText}
                editingTodoId={editingTodoId}
                editText={editText}
                editInputRef={editInputRef}
                getRelativeTime={getRelativeTime}
                startPomodoro={startPomodoro}
                categories={categories}
              />
            ))}
            {todos.length === 0 && (
              <li className="todo-item empty">No tasks yet. Add one above.</li>
            )}
          </ul>
        </SortableContext>
      </DndContext>

      {/* Pomodoro overlay */}
      {pomodoroEnd && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'var(--color-paper)',
            color: 'inherit',
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '14px',
          }}
        >
          <div>⏳ {Math.floor(pomodoroRemaining / 60)}:{String(pomodoroRemaining % 60).padStart(2, '0')}</div>
          <button
            className="pomodoro-stop-button"
            onClick={stopPomodoro}
          >
            Stop
          </button>
        </div>
      )}
    </div>
  )
}

export default TodoList