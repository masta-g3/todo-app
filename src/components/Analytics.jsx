import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { format, parseISO, differenceInDays, differenceInHours } from 'date-fns'

const Analytics = ({ todos }) => {
  const completionTimeChartRef = useRef(null)
  const categoryDistributionRef = useRef(null)
  const completionRateRef = useRef(null)
  const timeOfDayRef = useRef(null)

  // Prepare stats
  const totalTodos = todos.length
  const completedTodos = todos.filter(todo => todo.completed).length
  const completionRate = totalTodos > 0 ? (completedTodos / totalTodos * 100).toFixed(1) : 0
  
  // Average completion time (in days)
  const todosWithCompletionTime = todos.filter(todo => todo.completed && todo.completedAt)
  const avgCompletionTime = todosWithCompletionTime.length > 0 
    ? todosWithCompletionTime.reduce((sum, todo) => {
        const created = parseISO(todo.createdAt)
        const completed = parseISO(todo.completedAt)
        const daysDiff = differenceInHours(completed, created) / 24
        return sum + daysDiff
      }, 0) / todosWithCompletionTime.length
    : 0

  // Category distribution
  const categoryCount = todos.reduce((acc, todo) => {
    if (todo.category) {
      acc[todo.category] = (acc[todo.category] || 0) + 1
    } else {
      acc['Uncategorized'] = (acc['Uncategorized'] || 0) + 1
    }
    return acc
  }, {})

  // Task completion by day of week
  const completionsByDay = todos
    .filter(todo => todo.completed && todo.completedAt)
    .reduce((acc, todo) => {
      const completedDate = parseISO(todo.completedAt)
      const dayOfWeek = format(completedDate, 'EEEE')
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1
      return acc
    }, {})

  // Tasks completed by time of day
  const completionsByHour = todos
    .filter(todo => todo.completed && todo.completedAt)
    .reduce((acc, todo) => {
      const completedDate = parseISO(todo.completedAt)
      const hour = completedDate.getHours()
      let timeSlot

      if (hour >= 5 && hour < 12) timeSlot = 'Morning'
      else if (hour >= 12 && hour < 17) timeSlot = 'Afternoon'
      else if (hour >= 17 && hour < 21) timeSlot = 'Evening'
      else timeSlot = 'Night'

      acc[timeSlot] = (acc[timeSlot] || 0) + 1
      return acc
    }, {})

  // Tasks created in last 7 days vs tasks completed
  const tasksLastWeek = {}
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = format(date, 'MMM d')
    tasksLastWeek[dateStr] = { created: 0, completed: 0 }
  }

  todos.forEach(todo => {
    const createdDate = parseISO(todo.createdAt)
    const daysDiff = differenceInDays(today, createdDate)
    
    if (daysDiff <= 6) {
      const dateStr = format(createdDate, 'MMM d')
      if (tasksLastWeek[dateStr]) {
        tasksLastWeek[dateStr].created++
      }
    }

    if (todo.completed && todo.completedAt) {
      const completedDate = parseISO(todo.completedAt)
      const daysDiff = differenceInDays(today, completedDate)
      
      if (daysDiff <= 6) {
        const dateStr = format(completedDate, 'MMM d')
        if (tasksLastWeek[dateStr]) {
          tasksLastWeek[dateStr].completed++
        }
      }
    }
  })

  // Create visualization when component mounts
  useEffect(() => {
    if (todos.length > 0) {
      // Clean up existing charts
      if (completionTimeChartRef.current) d3.select(completionTimeChartRef.current).selectAll('*').remove()
      if (categoryDistributionRef.current) d3.select(categoryDistributionRef.current).selectAll('*').remove()
      if (completionRateRef.current) d3.select(completionRateRef.current).selectAll('*').remove()
      if (timeOfDayRef.current) d3.select(timeOfDayRef.current).selectAll('*').remove()
      
      // Create new charts
      createCategoryDistributionChart()
      createCompletionRateChart()
      createTimeOfDayChart()
      createWeeklyActivityChart()
    }
  }, [todos])

  // Category distribution chart - Tufte-inspired horizontal bar chart
  const createCategoryDistributionChart = () => {
    if (!categoryDistributionRef.current) return
    
    const data = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count) // Sort by count (descending)

    const margin = { top: 16, right: 8, bottom: 16, left: 100 }
    const width = categoryDistributionRef.current.clientWidth - margin.left - margin.right
    const height = Math.max(data.length * 28, 200) - margin.top - margin.bottom

    const svg = d3.select(categoryDistributionRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const y = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, height])
      .padding(0.3)

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.05])
      .range([0, width])

    // Y axis - category names
    svg.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('.domain').remove()
      
    // Gridlines
    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,0)`)
      .call(d3.axisBottom(x)
        .tickSize(height)
        .tickFormat('')
      )
      .selectAll('line')
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.3)
      
    svg.selectAll('.grid .domain').remove()

    // Bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', d => y(d.category))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', d => x(d.count))
      .attr('fill', 'var(--color-secondary)')
      .attr('opacity', 0.85)

    // Bar labels
    svg.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('y', d => y(d.category) + y.bandwidth() / 2 + 4)
      .attr('x', d => x(d.count) + 5)
      .text(d => d.count)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '11px')
      .attr('fill', 'var(--color-text-secondary)')
  }

  // Completion rate chart - Tufte-style minimal arc
  const createCompletionRateChart = () => {
    if (!completionRateRef.current) return
    
    const width = completionRateRef.current.clientWidth
    const height = 280
    const radius = Math.min(width, height) / 2.5

    const svg = d3.select(completionRateRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    // Create completion arc
    const arcGenerator = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .cornerRadius(4)
      .startAngle(0)
    
    // Background arc (incomplete)
    svg.append('path')
      .attr('d', arcGenerator.endAngle(2 * Math.PI))
      .attr('fill', 'var(--color-border)')
      .attr('opacity', 0.3)

    // Foreground arc (completed)
    const completionAngle = (completionRate / 100) * (2 * Math.PI)
    
    svg.append('path')
      .attr('d', arcGenerator.endAngle(completionAngle))
      .attr('fill', 'var(--color-primary)')

    // Completion rate text
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0em')
      .style('font-size', '2.8rem')
      .style('font-family', 'var(--font-heading)')
      .style('font-weight', '300')
      .style('fill', 'var(--color-primary)')
      .text(`${completionRate}%`)

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '2.2em')
      .style('font-size', '0.8rem')
      .style('font-family', 'var(--font-mono)')
      .style('fill', 'var(--color-text-secondary)')
      .style('letter-spacing', '0.05em')
      .text('COMPLETION RATE')

    // Data label
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '4em')
      .style('font-size', '0.8rem')
      .style('font-family', 'var(--font-mono)')
      .style('fill', 'var(--color-text-secondary)')
      .text(`${completedTodos} of ${totalTodos} tasks`)
  }

  // Time of day chart - Tufte-style minimal bar chart
  const createTimeOfDayChart = () => {
    if (!timeOfDayRef.current) return
    
    const data = Object.entries(completionsByHour).map(([timeSlot, count]) => ({
      timeSlot,
      count
    }))

    if (data.length === 0) return

    const margin = { top: 20, right: 10, bottom: 30, left: 20 }
    const width = timeOfDayRef.current.clientWidth - margin.left - margin.right
    const height = 220 - margin.top - margin.bottom

    const svg = d3.select(timeOfDayRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Order time slots correctly
    const timeOrder = ['Morning', 'Afternoon', 'Evening', 'Night']
    data.sort((a, b) => timeOrder.indexOf(a.timeSlot) - timeOrder.indexOf(b.timeSlot))

    const x = d3.scaleBand()
      .domain(data.map(d => d.timeSlot))
      .range([0, width])
      .padding(0.4)

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.1])
      .range([height, 0])

    // Gridlines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat('')
        .ticks(5)
      )
      .selectAll('line')
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.3)
      
    svg.selectAll('.grid .domain').remove()

    // Draw bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.timeSlot))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.count))
      .attr('height', d => height - y(d.count))
      .attr('fill', 'var(--color-accent)')
      .attr('opacity', 0.85)

    // X axis with custom styling
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px')
      .style('fill', 'var(--color-text-secondary)')
      
    svg.selectAll('.domain').remove()

    // Bar labels
    svg.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.timeSlot) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.count)
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px')
      .style('fill', 'var(--color-text-secondary)')
  }

  // Weekly activity chart - Tufte-style minimal line chart
  const createWeeklyActivityChart = () => {
    if (!completionTimeChartRef.current) return
    
    const data = Object.entries(tasksLastWeek).map(([date, counts]) => ({
      date,
      created: counts.created,
      completed: counts.completed
    }))

    const margin = { top: 20, right: 20, bottom: 30, left: 30 }
    const width = completionTimeChartRef.current.clientWidth - margin.left - margin.right
    const height = 220 - margin.top - margin.bottom

    const svg = d3.select(completionTimeChartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.date))
      .range([0, width])
      .padding(0.1)

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Math.max(d.created, d.completed)) * 1.1 || 1])
      .nice()
      .range([height, 0])

    // Gridlines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat('')
        .ticks(5)
      )
      .selectAll('line')
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.3)
      
    svg.selectAll('.grid .domain').remove()

    // Created line
    const lineCreated = d3.line()
      .x(d => x(d.date) + x.bandwidth() / 2)
      .y(d => y(d.created))
      .curve(d3.curveMonotoneX)

    svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', lineCreated)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-secondary)')
      .attr('stroke-width', 2)

    // Created dots
    svg.selectAll('.dot-created')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot-created')
      .attr('cx', d => x(d.date) + x.bandwidth() / 2)
      .attr('cy', d => y(d.created))
      .attr('r', 3)
      .attr('fill', 'var(--color-secondary)')

    // Completed line
    const lineCompleted = d3.line()
      .x(d => x(d.date) + x.bandwidth() / 2)
      .y(d => y(d.completed))
      .curve(d3.curveMonotoneX)

    svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', lineCompleted)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-width', 2)
    
    // Completed dots
    svg.selectAll('.dot-completed')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot-completed')
      .attr('cx', d => x(d.date) + x.bandwidth() / 2)
      .attr('cy', d => y(d.completed))
      .attr('r', 3)
      .attr('fill', 'var(--color-primary)')

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px')
      .style('fill', 'var(--color-text-secondary)')
      
    svg.selectAll('.domain').remove()

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 100}, 0)`)

    // Created legend
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 8)
      .attr('x2', 15)
      .attr('y2', 8)
      .attr('stroke', 'var(--color-secondary)')
      .attr('stroke-width', 2)

    legend.append('text')
      .attr('x', 20)
      .attr('y', 11)
      .text('Created')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px')
      .style('fill', 'var(--color-text-secondary)')

    // Completed legend
    legend.append('line')
      .attr('x1', 0)
      .attr('y1', 25)
      .attr('x2', 15)
      .attr('y2', 25)
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-width', 2)

    legend.append('text')
      .attr('x', 20)
      .attr('y', 28)
      .text('Completed')
      .style('font-family', 'var(--font-mono)')
      .style('font-size', '10px')
      .style('fill', 'var(--color-text-secondary)')
  }

  return (
    <div className="analytics">
      <div className="stats-container">
        <div className="stats-card">
          <h3>Weekly Task Activity</h3>
          <div className="chart-container" ref={completionTimeChartRef}></div>
        </div>
        <div className="stats-card">
          <h3>Task Completion</h3>
          <div className="chart-container" ref={completionRateRef}></div>
        </div>
        <div className="stats-card">
          <h3>Distribution by Category</h3>
          <div className="chart-container" ref={categoryDistributionRef}></div>
        </div>
        <div className="stats-card">
          <h3>Productivity Patterns</h3>
          <div className="chart-container" ref={timeOfDayRef}></div>
        </div>
      </div>

      <div className="stats-summary">
        <p><span className="stats-label">Avg. Completion Time:</span> {avgCompletionTime.toFixed(1)} days</p>
        <p><span className="stats-label">Total Tasks:</span> {totalTodos}</p>
        <p><span className="stats-label">Completed Tasks:</span> {completedTodos}</p>
      </div>
    </div>
  )
}

export default Analytics