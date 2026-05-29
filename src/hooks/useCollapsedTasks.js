import { supabase } from '../data/supabaseClient'
import { upsertUiState } from '../data/supabaseApi'

const KEY = 'vic-rod-tasks-app-collapsed-tasks'

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

export function isTaskCollapsed(taskId) {
  return readIds().has(taskId)
}

// Called during initial Supabase load to restore cloud collapsed state to localStorage.
export function restoreCollapsedTaskIds(ids) {
  writeIds(new Set(ids))
}

export function setTaskCollapsed(taskId, shouldBeCollapsed) {
  const ids = readIds()
  if (shouldBeCollapsed) {
    ids.add(taskId)
  } else {
    ids.delete(taskId)
  }
  writeIds(ids)

  // Sync to Supabase — uses the singleton client to get the current session without prop drilling
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      upsertUiState(session.user.id, { collapsedTaskIds: [...ids] }).catch(console.error)
    }
  })
}
