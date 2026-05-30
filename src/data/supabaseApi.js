import { supabase } from './supabaseClient'

// ---- camelCase ↔ snake_case mappers ----

function projectFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function projectToDb(project, userId) {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    color: project.color,
    archived: project.archived ?? false,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  }
}

function taskFromDb(row) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    completedAt: row.completed_at,
    priority: row.priority,
    status: row.status,
    projectId: row.project_id,
    pinned: row.pinned ?? false,
    subtasks: row.subtasks ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function taskToDb(task, userId) {
  return {
    id: task.id,
    user_id: userId,
    text: task.text,
    completed: task.completed,
    completed_at: task.completedAt ?? null,
    priority: task.priority,
    status: task.status,
    project_id: task.projectId ?? null,
    pinned: task.pinned ?? false,
    subtasks: task.subtasks ?? [],
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  }
}

// ---- projects ----

export async function fetchProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(projectFromDb)
}

export async function createProject(userId, project) {
  const { error } = await supabase
    .from('projects')
    .insert(projectToDb(project, userId))
  if (error) throw error
}

export async function updateProject(userId, id, changes) {
  const row = { updated_at: new Date().toISOString() }
  if ('name' in changes) row.name = changes.name
  if ('color' in changes) row.color = changes.color
  if ('archived' in changes) row.archived = changes.archived
  const { error } = await supabase
    .from('projects')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteProject(userId, id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

// ---- tasks ----

export async function fetchTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.map(taskFromDb)
}

export async function createTask(userId, task) {
  const { error } = await supabase
    .from('tasks')
    .insert(taskToDb(task, userId))
  if (error) throw error
}

export async function updateTask(userId, id, changes) {
  const row = { updated_at: new Date().toISOString() }
  if ('text' in changes) row.text = changes.text
  if ('completed' in changes) row.completed = changes.completed
  if ('completedAt' in changes) row.completed_at = changes.completedAt
  if ('priority' in changes) row.priority = changes.priority
  if ('status' in changes) row.status = changes.status
  if ('projectId' in changes) row.project_id = changes.projectId
  if ('pinned' in changes) row.pinned = changes.pinned
  if ('subtasks' in changes) row.subtasks = changes.subtasks
  const { error } = await supabase
    .from('tasks')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteTask(userId, id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

// ---- ui_state ----

export async function fetchUiState(userId) {
  const { data, error } = await supabase
    .from('ui_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    activeView: data.active_view,
    collapsedTaskIds: data.collapsed_task_ids ?? [],
  }
}

// ---- import ----

const VALID_PRIORITIES = new Set(['high', 'medium', 'low'])
const VALID_STATUSES = new Set(['capture', 'today', 'next', 'waiting', 'someday', 'backlog'])

export async function importLocalData(userId, localData) {
  const localProjects = localData.projects ?? []
  const localTasks = localData.tasks ?? []

  // Step 1: insert projects without old IDs — let Supabase generate UUIDs.
  // .select() returns the inserted rows so we can read the new ids.
  const projectIdMap = {} // old local id → new Supabase UUID
  let projectCount = 0

  if (localProjects.length > 0) {
    const rows = localProjects.map(p => ({
      user_id: userId,
      name: p.name ?? 'Unnamed',
      color: p.color ?? '#6366f1',
      archived: p.archived ?? false,
      created_at: p.createdAt ?? new Date().toISOString(),
      updated_at: p.updatedAt ?? new Date().toISOString(),
    }))

    const { data: inserted, error } = await supabase
      .from('projects')
      .insert(rows)
      .select('id')
    if (error) throw error

    // Map old local id → new Supabase UUID by position (insert preserves order)
    localProjects.forEach((p, i) => {
      if (p.id && inserted[i]) projectIdMap[p.id] = inserted[i].id
    })
    projectCount = inserted.length
  }

  // Step 2: insert tasks without old IDs, remapping projectId via the map.
  let taskCount = 0

  if (localTasks.length > 0) {
    const rows = localTasks.map(t => ({
      user_id: userId,
      text: t.text ?? '',
      completed: t.completed ?? false,
      completed_at: t.completedAt ?? null,
      priority: VALID_PRIORITIES.has(t.priority) ? t.priority : 'medium',
      status: VALID_STATUSES.has(t.status) ? t.status : 'today',
      project_id: t.projectId ? (projectIdMap[t.projectId] ?? null) : null,
      subtasks: t.subtasks ?? [],
      created_at: t.createdAt ?? new Date().toISOString(),
      updated_at: t.updatedAt ?? new Date().toISOString(),
    }))

    const { data: inserted, error } = await supabase
      .from('tasks')
      .insert(rows)
      .select('id')
    if (error) throw error
    taskCount = inserted.length
  }

  return { projectCount, taskCount }
}

// Partial upsert — only provided fields are written; others keep their DB value.
export async function upsertUiState(userId, changes) {
  const row = { user_id: userId, updated_at: new Date().toISOString() }
  if ('activeView' in changes) row.active_view = changes.activeView
  if ('collapsedTaskIds' in changes) row.collapsed_task_ids = changes.collapsedTaskIds
  const { error } = await supabase
    .from('ui_state')
    .upsert(row, { onConflict: 'user_id' })
  if (error) throw error
}
