import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'

const TodoList = ({ todos, toggleTodo, addTodo, updateTodo, categories }) => {
  const [newTodo, setNewTodo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [editingTodoId, setEditingTodoId] = useState(null)
  const [editText, setEditText] = useState('')
  const inputRef = useRef(null)
  const newCategoryRef = useRef(null)
  const editInputRef = useRef(null)

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

  // Sort todos - incomplete first, then by creation date (newest first)
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

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

      <ul className="todos-list">
        {sortedTodos.map((todo) => (
          <li 
            key={todo.id} 
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
          >
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
                  <span className="todo-tag">{todo.category}</span>
                )}
                
                {!editingTodoId && !todo.completed && (
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
              </div>
            </div>
          </li>
        ))}
        {todos.length === 0 && (
          <li className="todo-item empty">No tasks yet. Add one above.</li>
        )}
      </ul>
    </div>
  )
}

export default TodoList