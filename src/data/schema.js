export function generateId() {
  return crypto.randomUUID()
}

export const PRESET_COLORS = [
  { name: 'Teal',   value: '#0d9488' },
  { name: 'Coral',  value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Amber',  value: '#f59e0b' },
  { name: 'Sage',   value: '#84cc16' },
  { name: 'Plum',   value: '#a855f7' },
  { name: 'Sky',    value: '#0ea5e9' },
  { name: 'Slate',  value: '#64748b' },
  { name: 'Pink',   value: '#ec4899' },
]

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

const BUCKET_ORDER = { today: 0, next: 1, soon: 2, waiting: 3, backlog: 4, someday: 5 }

export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const pinDiff = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    if (pinDiff !== 0) return pinDiff
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (pd !== 0) return pd
    return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' })
  })
}

export function sortTasksByBucket(tasks) {
  return [...tasks].sort((a, b) => {
    const aB = a.status != null ? (BUCKET_ORDER[a.status] ?? 6) : 6
    const bB = b.status != null ? (BUCKET_ORDER[b.status] ?? 6) : 6
    if (aB !== bB) return aB - bB
    const pinDiff = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    if (pinDiff !== 0) return pinDiff
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (pd !== 0) return pd
    return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' })
  })
}

export function newTask(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    text: '',
    completed: false,
    priority: 'medium',
    status: 'today',
    projectId: null,
    subtasks: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function newProject(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    name: '',
    color: '#6366f1',
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
