import { useState, useLayoutEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import styles from './TaskCard.module.css'
import { ProjectBadge } from './ProjectBadge'
import { SubtaskList } from './SubtaskList'
import { isTaskCollapsed, setTaskCollapsed } from '../hooks/useCollapsedTasks'

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#94a3b8',
}

const STATUS_LABELS = {
  today: 'Today',
  next: 'Next',
  waiting: 'Waiting',
  someday: 'Someday',
  backlog: 'Later',
}

export function TaskCard({
  task, project, showStatus = false,
  onToggleComplete, onEdit, onDelete,
  onAddSubtask, onDeleteSubtask, onToggleSubtaskComplete, onPromoteSubtask,
}) {
  const subtasks = task.subtasks ?? []
  const completedSubtaskCount = subtasks.filter(s => s.completed).length
  const [subtasksOpen, setSubtasksOpen] = useState(() =>
    subtasks.length > 0 && !isTaskCollapsed(task.id)
  )

  // Safety net: correct the open state after mount in case the lazy initializer
  // ran before task.subtasks was fully hydrated (e.g. React StrictMode double-mount).
  useLayoutEffect(() => {
    if ((task.subtasks ?? []).length > 0 && !isTaskCollapsed(task.id)) {
      setSubtasksOpen(true)
    }
  }, [task.id]) // re-run only if the task itself is swapped (shouldn't happen)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.card} ${task.completed ? styles.completedCard : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.cardMain}>
        <div className={styles.dragHandle} {...listeners} {...attributes} aria-label="Drag task">
          ⠿
        </div>
        {onAddSubtask && (
          <button
            className={`${styles.subtaskToggle} ${subtasksOpen ? styles.subtaskToggleOpen : ''}`}
            onClick={() => {
              const next = !subtasksOpen
              setSubtasksOpen(next)
              setTaskCollapsed(task.id, !next)
            }}
            aria-label="Toggle subtasks"
            title={subtasksOpen ? 'Hide subtasks' : 'Show subtasks'}
          >
            {subtasksOpen ? '▾' : '▸'}
          </button>
        )}
        {onToggleComplete && (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={task.completed}
              onChange={onToggleComplete}
            />
          </label>
        )}
        <div
          className={styles.priorityBar}
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          aria-label={`Priority: ${task.priority}`}
        />
        <div className={styles.body}>
          <span className={`${styles.text} ${task.completed ? styles.strikethrough : ''}`}>
            {task.text}
          </span>
          <div className={styles.meta}>
            <span
              className={styles.priority}
              style={{ color: PRIORITY_COLORS[task.priority] }}
            >
              {task.priority}
            </span>
            {showStatus && task.status && (
              <span className={styles.statusBadge}>
                {STATUS_LABELS[task.status]}
              </span>
            )}
            {project && <ProjectBadge project={project} />}
            {subtasks.length > 0 && (
              <span className={styles.subtaskPill}>
                {completedSubtaskCount}/{subtasks.length}
              </span>
            )}
          </div>
        </div>
        <div className={styles.actions}>
          {onEdit && (
            <button className={styles.actionBtn} onClick={onEdit} aria-label="Edit task">
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={onDelete}
              aria-label="Delete task"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {subtasksOpen && onAddSubtask && (
        <SubtaskList
          subtasks={subtasks}
          onToggleComplete={onToggleSubtaskComplete}
          onDelete={onDeleteSubtask}
          onPromote={onPromoteSubtask}
          onAdd={onAddSubtask}
        />
      )}
    </div>
  )
}
