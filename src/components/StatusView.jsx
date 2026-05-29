import { useState } from 'react'
import styles from './StatusView.module.css'
import { ViewShell } from './ViewShell'
import { TaskCard } from './TaskCard'
import { Modal } from './Modal'
import { TaskForm } from './TaskForm'
import { sortTasks } from '../data/schema'

const EMPTY_MESSAGES = {
  capture:   'Nothing captured yet.',
  today:     'Nothing due today.',
  next:      'No next tasks.',
  waiting:   'Nothing waiting right now.',
  someday:   'No someday ideas yet.',
  backlog:   'Nothing parked for later.',
  app_ideas: 'No app ideas yet.',
}

export function StatusView({ status, title, tasks, projects, addTask, updateTask, deleteTask, toggleComplete, addSubtask, deleteSubtask, toggleSubtaskComplete, promoteSubtask }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))
  const statusTasks = tasks.filter(t => t.status === status)
  const activeTasks = sortTasks(statusTasks.filter(t => !t.completed))
  const completedTasks = sortTasks(statusTasks.filter(t => t.completed))
  const visibleTasks = showCompleted ? [...activeTasks, ...completedTasks] : activeTasks

  function openAdd() {
    setEditingTask(null)
    setModalOpen(true)
  }

  function openEdit(task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingTask(null)
  }

  function handleFormSubmit(fields) {
    if (editingTask) {
      updateTask(editingTask.id, fields)
    } else {
      addTask(fields)
    }
    closeModal()
  }

  function handleDelete(taskId) {
    if (window.confirm('Delete this task?')) {
      deleteTask(taskId)
    }
  }

  const headerRight = (
    <div className={styles.headerActions}>
      {completedTasks.length > 0 && (
        <button
          className={styles.toggleBtn}
          onClick={() => setShowCompleted(v => !v)}
        >
          {showCompleted
            ? 'Hide completed'
            : `Show completed (${completedTasks.length})`}
        </button>
      )}
      <button className={styles.addBtn} onClick={openAdd}>
        + Add task
      </button>
    </div>
  )

  return (
    <>
      <ViewShell title={title} headerRight={headerRight}>
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <p className={styles.empty}>{EMPTY_MESSAGES[status] ?? 'Nothing here yet.'}</p>
        )}
        {activeTasks.length === 0 && completedTasks.length > 0 && !showCompleted && (
          <p className={styles.empty}>All done for now.</p>
        )}
        {visibleTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            project={projectMap[task.projectId] ?? null}
            onToggleComplete={() => toggleComplete(task.id)}
            onEdit={() => openEdit(task)}
            onDelete={() => handleDelete(task.id)}
            onAddSubtask={(text) => addSubtask(task.id, text)}
            onDeleteSubtask={(subId) => deleteSubtask(task.id, subId)}
            onToggleSubtaskComplete={(subId) => toggleSubtaskComplete(task.id, subId)}
            onPromoteSubtask={(subId) => promoteSubtask(task.id, subId)}
          />
        ))}
      </ViewShell>

      {modalOpen && (
        <Modal onClose={closeModal}>
          <TaskForm
            initialValues={editingTask ?? { status }}
            projects={projects}
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  )
}
