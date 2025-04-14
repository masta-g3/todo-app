# Project Structure - Minimal Todo App

This document provides an in-depth overview of the application's architecture, component organization, and key functionality. It's intended for developers who need to understand or contribute to the codebase.

## Directory Structure

```
/todo-app/
├── index.html                # Main HTML entry point
├── package.json              # Project dependencies and scripts
├── vite.config.js            # Vite build configuration
└── src/                      # Application source code
    ├── main.jsx              # React application entry point
    ├── App.jsx               # Main application component with routing logic
    ├── index.css             # Global styles and CSS variables
    └── components/           # React components
        ├── TodoList.jsx      # Task list and task creation
        ├── Analytics.jsx     # Data visualization dashboard
        └── Settings.jsx      # User preferences and data management
```

## Core Components

### App.jsx

The main application component that serves as the container for all functionality:

- **State Management**: 
  - Manages global application state (todos, categories, darkMode)
  - Handles tab navigation between views
  - Controls data initialization and persistence

- **LocalStorage Operations**:
  - Implements robust persistence with initialization safety
  - Provides data import/export functionality
  - Uses debounced auto-saving to improve performance

- **Theme Management**:
  - Toggles dark mode by applying a 'dark' class to the HTML root
  - Persists user theme preference

### TodoList.jsx

Handles the core task management functionality:

- **Task Creation**:
  - Task input with validation
  - Category selection with auto-suggestions
  - On-the-fly category creation

- **Task Display**:
  - Responsive task list with completed/pending states
  - Visual indication of completion status
  - Category tag display
  - Date formatting

- **Task Interaction**:
  - Checkbox toggling for task completion
  - Auto-focus behavior for form inputs
  - Sort logic for task display order (pending first, then by date)

### Analytics.jsx

Sophisticated data visualization dashboard using D3.js:

- **Metrics Calculation**:
  - Task completion rate
  - Average completion time
  - Category distribution
  - Time-of-day productivity patterns
  - Weekly task activity

- **Visualizations**:
  - Weekly activity line chart
  - Completion rate arc chart
  - Category distribution bar chart
  - Time-of-day productivity chart

- **D3.js Integration**:
  - Custom chart creation functions
  - Responsive SVG rendering
  - Theme-compatible styling through CSS variables

### Settings.jsx

User preferences and data management interface:

- **Theme Settings**:
  - Dark/light mode toggle with visual preview
  - Immediate application of theme changes

- **Data Management**:
  - Manual save/load from localStorage
  - Data export to JSON file
  - Data import from previously exported files
  - Status message feedback system

## State Management

The application uses React's built-in state management with several key patterns:

- **Initialization Pattern**:
  - `isInitialized` flag prevents premature data operations
  - Sequenced initialization process for reliable startup
  - Error recovery with graceful fallbacks

- **State Dependencies**:
  - Auto-save effect with appropriate dependencies
  - Conditional effect execution based on initialization state
  - Cleanup functions to prevent memory leaks

- **State Structure**:
  - Task objects with comprehensive metadata
  - Normalized category storage
  - Settings isolated from task data

## CSS Architecture

The styling system follows a well-structured approach:

- **CSS Variables**:
  - Color palette defined in root scope
  - Dark mode variables through class-based switching
  - Typography and spacing variables for consistency

- **Component-Specific Styles**:
  - Hierarchical class naming
  - Logical grouping by component and functionality
  - Consistent padding/margin through grid units

- **Responsive Design**:
  - Mobile-first approach with breakpoints
  - Flexible layout that adapts to viewport size
  - Consistent interaction targets for touch devices

## Data Persistence

The application implements a robust data persistence strategy:

- **LocalStorage Structure**:
  - `todos`: Array of task objects
  - `categories`: Array of category strings
  - `settings`: Object containing user preferences

- **Persistence Lifecycle**:
  - Initial load during app initialization
  - Debounced auto-save on state changes
  - Manual save/load capabilities
  - Export/import for cross-device usage

- **Error Handling**:
  - Try/catch blocks around all storage operations
  - User feedback for operation status
  - Recovery mechanisms for failed operations

## Theme System

The dark mode implementation follows modern best practices:

- **Class-Based Approach**:
  - Applies 'dark' class to HTML root element
  - CSS variables change based on presence of class
  - All components respect theme variables

- **User Preference**:
  - User selection persisted in localStorage
  - Accessible from header toggle or settings page
  - Visual indication of current theme

## Future Enhancement Areas

Potential areas for future development:

- **Authentication**: User accounts and cloud sync
- **Advanced Filtering**: Search and complex filtering options
- **Task Dependencies**: Sub-tasks and task relationships
- **Notifications**: Reminders for pending tasks
- **Collaborative Features**: Shared task lists and multi-user support
- **Customization**: Additional themes or custom color schemes
- **Offline Support**: Service worker integration for full offline functionality

## Development Workflow

To work on this project:

1. Understand the component hierarchy and state management approach
2. Respect the existing patterns for component organization
3. Maintain consistent styling through CSS variables
4. Ensure persistence operations handle errors gracefully
5. Test changes in both light and dark modes
6. Verify responsive behavior on different viewport sizes