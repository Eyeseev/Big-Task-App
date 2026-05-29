import { useState, useRef, useEffect } from 'react'
import { ViewShell } from '../components/ViewShell'
import { TaskCard } from '../components/TaskCard'
import { Modal } from '../components/Modal'
import { TaskForm } from '../components/TaskForm'
import { ProjectForm } from '../components/ProjectForm'
import { sortTasks } from '../data/schema'
import styles from './ProjectsView.module.css'

const COLLAPSED_PROJECTS_KEY = 'vic-rod-tasks-app-collapsed-projects'

function readCollapsedProjects() {
  try {
    const raw = localStorage.getItem(COLLAPSED_PROJECTS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function writeCollapsedProjects(set) {
  try {
    localStorage.setItem(COLLAPSED_PROJECTS_KEY, JSON.stringify([...set]))
  } catch {}
}

export function ProjectsView({ tasks, projects, addTask, updateTask, deleteTask, toggleComplete, addProject, updateProject, deleteProject, addSubtask, deleteSubtask, toggleSubtaskComplete, promoteSubtask, scrollToProjectId, onScrollHandled }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [taskModal, setTaskModal] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [collapsedProjects, setCollapsedProjects] = useState(readCollapsedProjects)
  const groupRefs = useRef({})
  const [highlightedId, setHighlightedId] = useState(null)

  useEffect(() => {
    if (!scrollToProjectId) return
    const el = groupRefs.current[scrollToProjectId]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlightedId(scrollToProjectId)
    onScrollHandled?.()
    const t = setTimeout(() => setHighlightedId(null), 1500)
    return () => clearTimeout(t)
  }, [scrollToProjectId, onScrollHandled])

  function toggleProjectCollapsed(key) {
    setCollapsedProjects(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      writeCollapsedProjects(next)
      return next
    })
  }

  // --- Task handlers ---
  function openAddTask(projectId) {
    setTaskModal({ projectId: projectId ?? null, status: 'next' })
  }
  function openEditTask(task) { setTaskModal(task) }
  function closeTaskModal() { setTaskModal(null) }
  function handleTaskFormSubmit(fields) {
    if (taskModal?.id) {
      updateTask(taskModal.id, fields)
    } else {
      addTask(fields)
    }
    closeTaskModal()
  }
  function handleDeleteTask(taskId) {
    if (window.confirm('Delete this task?')) deleteTask(taskId)
  }

  // --- Project handlers ---
  function openAddProject() { setEditingProject({}) }
  function openEditProject(project) { setEditingProject(project) }
  function closeProjectModal() { setEditingProject(null) }
  function handleProjectFormSubmit(fields) {
    if (editingProject?.id) {
      updateProject(editingProject.id, fields)
    } else {
      addProject(fields)
    }
    closeProjectModal()
  }
  function handleDeleteProject(projectId) {
    if (window.confirm('Delete this project? Tasks will not be deleted, but they will become unassigned.')) {
      deleteProject(projectId)
    }
  }

  // --- Computed values ---
  const totalCompleted = tasks.filter(t => t.completed).length
  const sortedProjects = [...projects].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  const _allUnassigned = tasks.filter(t => !t.projectId)
  const _unassignedActive = sortTasks(_allUnassigned.filter(t => !t.completed))
  const _unassignedCompleted = sortTasks(_allUnassigned.filter(t => t.completed))
  const unassigned = showCompleted ? [..._unassignedActive, ..._unassignedCompleted] : _unassignedActive

  // --- Header ---
  const headerRight = (
    <div className={styles.headerActions}>
      {totalCompleted > 0 && (
        <button className={styles.toggleBtn} onClick={() => setShowCompleted(v => !v)}>
          {showCompleted ? 'Hide completed' : `Show completed (${totalCompleted})`}
        </button>
      )}
      <button className={styles.newProjectBtn} onClick={openAddProject}>
        + New project
      </button>
    </div>
  )

  return (
    <>
      <ViewShell title="Projects" headerRight={headerRight}>
        {projects.length === 0 && (
          <p className={styles.empty}>No projects yet. Click "+ New project" to create one.</p>
        )}

        {sortedProjects.map(project => {
          const _all = tasks.filter(t => t.projectId === project.id)
          const _active = sortTasks(_all.filter(t => !t.completed))
          const _completed = sortTasks(_all.filter(t => t.completed))
          const projectTasks = showCompleted ? [..._active, ..._completed] : _active
          const isCollapsed = collapsedProjects.has(project.id)

          return (
            <div key={project.id} className={styles.group} ref={el => { groupRefs.current[project.id] = el }}>
              <div className={`${styles.groupHeader} ${highlightedId === project.id ? styles.highlighted : ''}`} style={{ borderLeftColor: project.color }}>
                <button
                  className={styles.collapseBtn}
                  onClick={() => toggleProjectCollapsed(project.id)}
                  aria-label={isCollapsed ? `Expand ${project.name}` : `Collapse ${project.name}`}
                >
                  {isCollapsed ? '▸' : '▾'}
                </button>
                <span className={styles.groupName}>{project.name}</span>
                <div className={styles.groupActions}>
                  {_all.length > 0 && (
                    <span className={styles.groupCount}>
                      {_active.length}
                      {showCompleted && _completed.length > 0 && (
                        <span className={styles.completedCount}> · {_completed.length} done</span>
                      )}
                    </span>
                  )}
                  <button
                    className={styles.addTaskBtn}
                    onClick={() => openAddTask(project.id)}
                    aria-label={`Add task to ${project.name}`}
                  >
                    + Add
                  </button>
                  <button
                    className={styles.groupActionBtn}
                    onClick={() => openEditProject(project)}
                    aria-label={`Edit ${project.name}`}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.groupActionBtn} ${styles.deleteProjectBtn}`}
                    onClick={() => handleDeleteProject(project.id)}
                    aria-label={`Delete ${project.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                _all.length === 0 ? (
                  <p className={styles.empty}>No tasks yet.</p>
                ) : projectTasks.length === 0 ? (
                  <p className={styles.empty}>All done for now.</p>
                ) : (
                  projectTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={project}
                      showStatus
                      onToggleComplete={() => toggleComplete(task.id)}
                      onEdit={() => openEditTask(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onAddSubtask={(text) => addSubtask(task.id, text)}
                      onDeleteSubtask={(subId) => deleteSubtask(task.id, subId)}
                      onToggleSubtaskComplete={(subId) => toggleSubtaskComplete(task.id, subId)}
                      onPromoteSubtask={(subId) => promoteSubtask(task.id, subId)}
                    />
                  ))
                )
              )}
            </div>
          )
        })}

        {/* Unassigned group */}
        {(() => {
          const isCollapsed = collapsedProjects.has('unassigned')
          return (
            <div className={styles.group} ref={el => { groupRefs.current['unassigned'] = el }}>
              <div className={`${styles.groupHeader} ${styles.unassigned} ${highlightedId === 'unassigned' ? styles.highlighted : ''}`}>
                <button
                  className={styles.collapseBtn}
                  onClick={() => toggleProjectCollapsed('unassigned')}
                  aria-label={isCollapsed ? 'Expand Unassigned' : 'Collapse Unassigned'}
                >
                  {isCollapsed ? '▸' : '▾'}
                </button>
                <span className={styles.groupName}>Unassigned</span>
                <div className={styles.groupActions}>
                  {_allUnassigned.length > 0 && (
                    <span className={styles.groupCount}>
                      {_unassignedActive.length}
                      {showCompleted && _unassignedCompleted.length > 0 && (
                        <span className={styles.completedCount}> · {_unassignedCompleted.length} done</span>
                      )}
                    </span>
                  )}
                  <button
                    className={styles.addTaskBtn}
                    onClick={() => openAddTask(null)}
                    aria-label="Add unassigned task"
                  >
                    + Add
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                _allUnassigned.length === 0 ? (
                  <p className={styles.empty}>No unassigned tasks.</p>
                ) : unassigned.length === 0 ? (
                  <p className={styles.empty}>All done for now.</p>
                ) : (
                  unassigned.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={null}
                      showStatus
                      onToggleComplete={() => toggleComplete(task.id)}
                      onEdit={() => openEditTask(task)}
                      onDelete={() => handleDeleteTask(task.id)}
                      onAddSubtask={(text) => addSubtask(task.id, text)}
                      onDeleteSubtask={(subId) => deleteSubtask(task.id, subId)}
                      onToggleSubtaskComplete={(subId) => toggleSubtaskComplete(task.id, subId)}
                      onPromoteSubtask={(subId) => promoteSubtask(task.id, subId)}
                    />
                  ))
                )
              )}
            </div>
          )
        })()}
      </ViewShell>

      {taskModal !== null && (
        <Modal onClose={closeTaskModal}>
          <TaskForm
            initialValues={taskModal}
            projects={projects}
            onSubmit={handleTaskFormSubmit}
            onCancel={closeTaskModal}
          />
        </Modal>
      )}

      {editingProject !== null && (
        <Modal onClose={closeProjectModal}>
          <ProjectForm
            initialValues={editingProject}
            onSubmit={handleProjectFormSubmit}
            onCancel={closeProjectModal}
          />
        </Modal>
      )}
    </>
  )
}
