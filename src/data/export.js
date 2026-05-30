const STATUS_ORDER = ['capture', 'today', 'next', 'waiting', 'someday', 'backlog']

const STATUS_LABELS = {
  capture: 'Capture',
  today:   'Today',
  next:    'Next',
  waiting: 'Waiting',
  someday: 'Someday',
  backlog: 'Later',
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

function subtaskLines(subtasks) {
  return (subtasks ?? []).map(sub => {
    const check = sub.completed ? '[x]' : '[ ]'
    return `  - ${check} ${sub.text}`
  })
}

export function buildMarkdown(tasks, projects) {
  const date = new Date().toISOString().slice(0, 10)
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))
  const lines = [`# Vic Rod Tasks Export — ${date}`, '']

  // Status sections
  for (const status of STATUS_ORDER) {
    lines.push(`## ${STATUS_LABELS[status]}`)
    const statusTasks = tasks.filter(t => t.status === status)
    if (statusTasks.length === 0) {
      lines.push('')
    } else {
      for (const task of statusTasks) {
        const check = task.completed ? '[x]' : '[ ]'
        const project = task.projectId ? projectMap[task.projectId] : null
        const projectPart = project ? ` — Project: ${project.name}` : ''
        const pinnedPart = task.pinned ? ' 📌' : ''
        lines.push(`- ${check} ${task.text}${pinnedPart} — ${cap(task.priority)}${projectPart}`)
        lines.push(...subtaskLines(task.subtasks))
      }
      lines.push('')
    }
  }

  // Projects section
  lines.push('## Projects')
  lines.push('')

  const sortedProjects = [...projects].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  for (const project of sortedProjects) {
    lines.push(`### ${project.name}`)
    const projectTasks = tasks.filter(t => t.projectId === project.id)
    if (projectTasks.length === 0) {
      lines.push('_(no tasks)_')
    } else {
      for (const task of projectTasks) {
        const check = task.completed ? '[x]' : '[ ]'
        const statusLabel = STATUS_LABELS[task.status] ?? task.status
        const pinnedPart = task.pinned ? ' 📌' : ''
        lines.push(`- ${check} ${task.text}${pinnedPart} — ${statusLabel} — ${cap(task.priority)}`)
        lines.push(...subtaskLines(task.subtasks))
      }
    }
    lines.push('')
  }

  // Unassigned
  const unassigned = tasks.filter(t => !t.projectId)
  if (unassigned.length > 0) {
    lines.push('### Unassigned')
    for (const task of unassigned) {
      const check = task.completed ? '[x]' : '[ ]'
      const statusLabel = STATUS_LABELS[task.status] ?? task.status
      const pinnedPart = task.pinned ? ' 📌' : ''
      lines.push(`- ${check} ${task.text}${pinnedPart} — ${statusLabel} — ${cap(task.priority)}`)
      lines.push(...subtaskLines(task.subtasks))
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function downloadMarkdown(tasks, projects) {
  const date = new Date().toISOString().slice(0, 10)
  const filename = `vic-rod-tasks-${date}.md`
  const content = buildMarkdown(tasks, projects)
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
