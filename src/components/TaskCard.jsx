import { useState, useLayoutEffect, Fragment } from 'react'
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
  soon: 'Soon',
  waiting: 'Waiting',
  someday: 'Someday',
  backlog: 'Later',
}

// Matches (in priority order): full URLs, mailto:, emails, bare domains (e.g. google.com)
const LINK_RE = /\b(?:https?:\/\/[^\s<>"']*|mailto:[^\s<>"']*|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9\-]{2,}(?:\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,6}(?:\/[^\s<>"']*)?)/g

function renderLine(line, lineIdx, linkClass) {
  const re = new RegExp(LINK_RE.source, 'g')
  const result = []
  let lastIndex = 0
  let match

  while ((match = re.exec(line)) !== null) {
    if (match.index > lastIndex) result.push(line.slice(lastIndex, match.index))

    // Strip trailing punctuation from the match before linkifying
    const raw = match[0]
    const text = raw.replace(/[.,;:!?)\]]+$/, '')
    const trail = raw.slice(text.length)

    const href = /^https?:\/\//.test(text)
      ? text
      : /^mailto:/.test(text)
        ? text
        : text.includes('@')
          ? `mailto:${text}`
          : `https://${text}`

    result.push(
      <a key={`${lineIdx}-${match.index}`} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {text}
      </a>
    )
    if (trail) result.push(trail)
    lastIndex = match.index + raw.length
  }

  if (lastIndex < line.length) result.push(line.slice(lastIndex))
  return result
}

function renderDescription(text, maxLines, linkClass) {
  const lines = text.split('\n')
  const visible = maxLines != null ? lines.slice(0, maxLines) : lines
  return visible.map((line, idx) => (
    <Fragment key={idx}>
      {idx > 0 && <br />}
      {renderLine(line, idx, linkClass)}
    </Fragment>
  ))
}

const DESC_COLLAPSE_THRESHOLD = 3

export function TaskCard({
  task, project, showStatus = false,
  onToggleComplete, onEdit, onDelete,
  onAddSubtask, onDeleteSubtask, onToggleSubtaskComplete, onPromoteSubtask,
  onTogglePin,
}) {
  const subtasks = task.subtasks ?? []
  const completedSubtaskCount = subtasks.filter(s => s.completed).length
  const [subtasksOpen, setSubtasksOpen] = useState(() =>
    subtasks.length > 0 && !isTaskCollapsed(task.id)
  )

  const desc = task.description ?? ''
  const descLines = desc ? desc.split('\n') : []
  const descIsLong = descLines.length > DESC_COLLAPSE_THRESHOLD
  const [descExpanded, setDescExpanded] = useState(false)

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
      className={`${styles.card} ${task.completed ? styles.completedCard : ''} ${isDragging ? styles.dragging : ''} ${task.pinned ? styles.pinnedCard : ''}`}
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
          {desc && (
            <div className={styles.description}>
              <span className={styles.descText}>
                {renderDescription(desc, descIsLong && !descExpanded ? DESC_COLLAPSE_THRESHOLD : null, styles.descLink)}
              </span>
              {descIsLong && (
                <button
                  className={styles.descToggle}
                  onClick={e => { e.stopPropagation(); setDescExpanded(v => !v) }}
                >
                  {descExpanded ? 'Less' : `+${descLines.length - DESC_COLLAPSE_THRESHOLD} more`}
                </button>
              )}
            </div>
          )}
        </div>
        <div className={styles.actions}>
          {onTogglePin && (
            <button
              className={`${styles.actionBtn} ${task.pinned ? styles.pinBtnActive : ''}`}
              onClick={onTogglePin}
              aria-label={task.pinned ? 'Unpin task' : 'Pin to top'}
              title={task.pinned ? 'Unpin' : 'Pin to top'}
            >
              📌
            </button>
          )}
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
