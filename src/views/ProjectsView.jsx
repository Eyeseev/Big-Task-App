import { useState } from 'react'
import { ViewShell } from '../components/ViewShell'
import { TaskCard } from '../components/TaskCard'
import { Modal } from '../components/Modal'
import { TaskForm } from '../components/TaskForm'
import { ProjectForm } from '../components/ProjectForm'
import { sortTasks } from '../data/schema'
import styles from './ProjectsView.module.css'

export function ProjectsView({ tasks, projects, addTask, updateTask, deleteTask, toggleComplete, addProject, updateProject, deleteProject, addSubtask, deleteSubtask, toggleSubtaskComplete, promoteSubtask }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [taskModal, setTaskModal] = useState(null)      // null | {projectId, status} | task-object
  const [editingProject, setEditingProject] = useState(null)  // null | {} | project-object

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

          return (
            <div key={project.id} className={styles.group}>
              <div className={styles.groupHeader} style={{ borderLeftColor: project.color }}>
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

              {_all.length === 0 ? (
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
              )}
            </div>
          )
        })}

        {/* Unassigned group — always visible so + Add is always accessible */}
        <div className={styles.group}>
          <div className={`${styles.groupHeader} ${styles.unassigned}`}>
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
          {_allUnassigned.length === 0 ? (
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
          )}
        </div>
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
