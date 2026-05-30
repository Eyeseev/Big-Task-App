import { useState } from 'react'
import styles from './TaskForm.module.css'

const PRIORITIES = [
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]

const STATUSES = [
  { value: 'capture', label: 'Capture' },
  { value: 'today',   label: 'Today' },
  { value: 'next',    label: 'Next' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'someday', label: 'Someday' },
  { value: 'backlog', label: 'Later' },
]

export function TaskForm({ initialValues, onSubmit, onCancel, projects = [] }) {
  const [text, setText] = useState(initialValues?.text ?? '')
  const [priority, setPriority] = useState(initialValues?.priority ?? 'medium')
  const [status, setStatus] = useState(initialValues?.status ?? 'today')
  const [projectId, setProjectId] = useState(initialValues?.projectId ?? null)

  const isEditing = !!initialValues?.id

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSubmit({ text: text.trim(), priority, status, projectId })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>{isEditing ? 'Edit task' : 'Add task'}</h2>

      <label className={styles.label}>
        Task
        <input
          className={styles.input}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
      </label>

      <div className={styles.row}>
        <label className={styles.label}>
          Priority
          <select
            className={styles.select}
            value={priority}
            onChange={e => setPriority(e.target.value)}
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Status
          <select
            className={styles.select}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.label}>
        Project
        <select
          className={styles.select}
          value={projectId ?? ''}
          onChange={e => setProjectId(e.target.value || null)}
        >
          <option value="">None</option>
          {[...projects]
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
            .map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
      </label>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn}>
          {isEditing ? 'Save changes' : 'Add task'}
        </button>
      </div>
    </form>
  )
}
