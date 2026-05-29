import { useState, useEffect } from 'react'
import { loadData } from '../data/storage'
import { generateId } from '../data/schema'
import * as api from '../data/supabaseApi'
import { restoreCollapsedTaskIds } from './useCollapsedTasks'

function now() { return new Date().toISOString() }

export function useAppData(userId) {
  const [data, setData] = useState({ tasks: [], projects: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [uiState, setUiState] = useState(null)

  // Auto-clear save error banner after 5 s
  useEffect(() => {
    if (!saveError) return
    const t = setTimeout(() => setSaveError(null), 5000)
    return () => clearTimeout(t)
  }, [saveError])

  // Initial load from Supabase
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [projects, tasks, loadedUiState] = await Promise.all([
          api.fetchProjects(userId),
          api.fetchTasks(userId),
          api.fetchUiState(userId),
        ])
        if (cancelled) return
        setData({ projects, tasks })
        setUiState(loadedUiState)
        // Write cloud collapsed IDs to localStorage so TaskCards read the correct initial state.
        // This only touches the collapsed-IDs key, not the task/project data key.
        if (loadedUiState?.collapsedTaskIds) {
          restoreCollapsedTaskIds(loadedUiState.collapsedTaskIds)
        }
      } catch (err) {
        if (cancelled) return
        console.error('Supabase load error:', err)
        setLoadError('Failed to load data. Check your connection and refresh.')
        // Fall back to localStorage so the app is not blank on network failure
        const stored = loadData()
        if (stored) setData(stored)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  function handleSaveError(err) {
    console.error('Supabase save error:', err)
    setSaveError('Save failed. Check your connection.')
  }

  // ---- tasks ----

  function addTask(fields) {
    const n = now()
    const task = {
      id: generateId(),
      text: fields.text,
      completed: false,
      priority: fields.priority ?? 'medium',
      status: fields.status ?? 'today',
      projectId: fields.projectId ?? null,
      subtasks: [],
      createdAt: n,
      updatedAt: n,
    }
    setData(d => ({ ...d, tasks: [...d.tasks, task] }))
    api.createTask(userId, task).catch(handleSaveError)
  }

  function updateTask(id, changes) {
    const n = now()
    setData(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === id ? { ...t, ...changes, updatedAt: n } : t
      ),
    }))
    api.updateTask(userId, id, changes).catch(handleSaveError)
  }

  function deleteTask(id) {
    setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }))
    api.deleteTask(userId, id).catch(handleSaveError)
  }

  function toggleComplete(id) {
    const n = now()
    // Read current value before setData so we pass the right new value to Supabase
    const task = data.tasks.find(t => t.id === id)
    if (!task) return
    const completed = !task.completed
    const completedAt = completed ? n : null
    setData(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === id ? { ...t, completed, completedAt, updatedAt: n } : t
      ),
    }))
    api.updateTask(userId, id, { completed, completedAt }).catch(handleSaveError)
  }

  // ---- projects ----

  function addProject(fields) {
    const n = now()
    const project = {
      id: generateId(),
      name: fields.name,
      color: fields.color,
      archived: false,
      createdAt: n,
      updatedAt: n,
    }
    setData(d => ({ ...d, projects: [...d.projects, project] }))
    api.createProject(userId, project).catch(handleSaveError)
  }

  function updateProject(id, changes) {
    const n = now()
    setData(d => ({
      ...d,
      projects: d.projects.map(p =>
        p.id === id ? { ...p, ...changes, updatedAt: n } : p
      ),
    }))
    api.updateProject(userId, id, changes).catch(handleSaveError)
  }

  function deleteProject(id) {
    const n = now()
    setData(d => ({
      ...d,
      projects: d.projects.filter(p => p.id !== id),
      // Optimistic: clear projectId in React state immediately.
      // The Supabase FK cascade (on delete set null) handles the DB side.
      tasks: d.tasks.map(t =>
        t.projectId === id ? { ...t, projectId: null, updatedAt: n } : t
      ),
    }))
    api.deleteProject(userId, id).catch(handleSaveError)
  }

  // ---- subtasks ----

  function addSubtask(taskId, text) {
    const n = now()
    const subtask = { id: generateId(), text, completed: false, createdAt: n, updatedAt: n }
    const parent = data.tasks.find(t => t.id === taskId)
    if (!parent) return
    const newSubtasks = [...(parent.subtasks ?? []), subtask]
    setData(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === taskId ? { ...t, subtasks: newSubtasks, updatedAt: n } : t
      ),
    }))
    api.updateTask(userId, taskId, { subtasks: newSubtasks }).catch(handleSaveError)
  }

  function deleteSubtask(taskId, subtaskId) {
    const n = now()
    const parent = data.tasks.find(t => t.id === taskId)
    if (!parent) return
    const newSubtasks = (parent.subtasks ?? []).filter(s => s.id !== subtaskId)
    setData(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === taskId ? { ...t, subtasks: newSubtasks, updatedAt: n } : t
      ),
    }))
    api.updateTask(userId, taskId, { subtasks: newSubtasks }).catch(handleSaveError)
  }

  function toggleSubtaskComplete(taskId, subtaskId) {
    const n = now()
    const parent = data.tasks.find(t => t.id === taskId)
    if (!parent) return
    const newSubtasks = (parent.subtasks ?? []).map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed, updatedAt: n } : s
    )
    setData(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === taskId ? { ...t, subtasks: newSubtasks, updatedAt: n } : t
      ),
    }))
    api.updateTask(userId, taskId, { subtasks: newSubtasks }).catch(handleSaveError)
  }

  function promoteSubtask(taskId, subtaskId) {
    const n = now()
    const parent = data.tasks.find(t => t.id === taskId)
    if (!parent) return
    const sub = (parent.subtasks ?? []).find(s => s.id === subtaskId)
    if (!sub) return
    const promoted = {
      id: generateId(),
      text: sub.text,
      completed: sub.completed,
      priority: parent.priority,
      status: parent.status,
      projectId: parent.projectId,
      subtasks: [],
      createdAt: n,
      updatedAt: n,
    }
    const newParentSubtasks = (parent.subtasks ?? []).filter(s => s.id !== subtaskId)
    setData(d => ({
      ...d,
      tasks: [
        ...d.tasks.map(t =>
          t.id === taskId
            ? { ...t, subtasks: newParentSubtasks, updatedAt: n }
            : t
        ),
        promoted,
      ],
    }))
    Promise.all([
      api.updateTask(userId, taskId, { subtasks: newParentSubtasks }),
      api.createTask(userId, promoted),
    ]).catch(handleSaveError)
  }

  return {
    data,
    loading,
    loadError,
    saveError,
    uiState,
    addTask, updateTask, deleteTask, toggleComplete,
    addProject, updateProject, deleteProject,
    addSubtask, deleteSubtask, toggleSubtaskComplete, promoteSubtask,
  }
}
