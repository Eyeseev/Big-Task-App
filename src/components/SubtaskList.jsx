import { useState } from 'react'
import styles from './SubtaskList.module.css'

export function SubtaskList({ subtasks, onToggleComplete, onDelete, onPromote, onAdd }) {
  const [newText, setNewText] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    if (!newText.trim()) return
    onAdd(newText.trim())
    setNewText('')
  }

  return (
    <div className={styles.list}>
      {subtasks.map(sub => (
        <div key={sub.id} className={`${styles.subtask} ${sub.completed ? styles.completed : ''}`}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={sub.completed}
              onChange={() => onToggleComplete(sub.id)}
            />
          </label>
          <span className={`${styles.text} ${sub.completed ? styles.strikethrough : ''}`}>
            {sub.text}
          </span>
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={() => onPromote(sub.id)}
              title="Promote to task"
              aria-label="Promote to task"
            >
              ↑
            </button>
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={() => onDelete(sub.id)}
              title="Delete subtask"
              aria-label="Delete subtask"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <form onSubmit={handleAdd} className={styles.addForm}>
        <input
          className={styles.addInput}
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Add subtask…"
        />
      </form>
    </div>
  )
}
