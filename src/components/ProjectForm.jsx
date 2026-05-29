import { useState } from 'react'
import styles from './ProjectForm.module.css'
import { PRESET_COLORS } from '../data/schema'

export function ProjectForm({ initialValues, onSubmit, onCancel }) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [color, setColor] = useState(initialValues?.color ?? PRESET_COLORS[0].value)

  const isEditing = !!initialValues?.id

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), color })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>{isEditing ? 'Edit project' : 'New project'}</h2>

      <label className={styles.label}>
        Project name
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Finances, Camping..."
          autoFocus
        />
      </label>

      <div className={styles.colorSection}>
        <span className={styles.colorLabel}>Color</span>
        <div className={styles.swatches}>
          {PRESET_COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              className={`${styles.swatch} ${color === c.value ? styles.selected : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => setColor(c.value)}
              aria-label={c.name}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn}>
          {isEditing ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </form>
  )
}
