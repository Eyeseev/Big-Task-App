import { supabase } from '../data/supabaseClient'
import { upsertUiState } from '../data/supabaseApi'

// Stores IDs of tasks the user has manually expanded.
// Default is collapsed; a task not in this set is treated as collapsed.
const KEY = 'vic-rod-tasks-app-expanded-tasks'

function readIds() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function writeIds(set) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]))
  } catch {}
}

// Returns true when the task is collapsed (not in the expanded set).
export function isTaskCollapsed(taskId) {
  return !readIds().has(taskId)
}

// Called during initial Supabase load to restore expanded task IDs to localStorage.
export function restoreExpandedTaskIds(ids) {
  writeIds(new Set(ids))
}

export function setTaskCollapsed(taskId, shouldBeCollapsed) {
  const ids = readIds()
  if (shouldBeCollapsed) {
    ids.delete(taskId)  // not in expanded set → collapsed
  } else {
    ids.add(taskId)     // in expanded set → expanded
  }
  writeIds(ids)

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      upsertUiState(session.user.id, { collapsedTaskIds: [...ids] }).catch(console.error)
    }
  })
}
