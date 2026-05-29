const KEY = 'vic-rod-tasks-app'

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable or full — no-op
  }
}
