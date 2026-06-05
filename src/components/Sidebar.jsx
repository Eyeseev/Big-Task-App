import { useDroppable } from '@dnd-kit/core'
import { supabase } from '../data/supabaseClient'
import styles from './Sidebar.module.css'

const STATUS_NAV_ITEMS = [
  { id: 'capture',   label: 'Capture' },
  { id: 'today',     label: 'Today' },
  { id: 'next',      label: 'Next' },
  { id: 'soon',      label: 'Soon' },
  { id: 'waiting',   label: 'Waiting' },
  { id: 'backlog',   label: 'Later' },
  { id: 'someday',   label: 'Someday' },
]

function StatusNavItem({ item, active, onViewChange, count = 0 }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${item.id}`,
    data: { type: 'status', status: item.id },
  })

  return (
    <li>
      <button
        ref={setNodeRef}
        className={`${styles.navBtn} ${active ? styles.active : ''} ${isOver ? styles.dropTarget : ''}`}
        onClick={() => onViewChange(item.id)}
      >
        {item.label}
        {count > 0 && <span className={styles.navCount}>{count}</span>}
      </button>
    </li>
  )
}

function ProjectNavItem({ project, onProjectJump, utility = false }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-${project.id}`,
    data: { type: 'project', projectId: project.id },
  })

  return (
    <li>
      <button
        ref={setNodeRef}
        className={`${styles.projectBtn} ${utility ? styles.utilityProjectBtn : ''} ${isOver ? styles.projectDropTarget : ''}`}
        onClick={() => onProjectJump(project.id)}
        title={project.name}
      >
        <span
          className={styles.projectDot}
          style={{ backgroundColor: project.color }}
        />
        <span className={styles.projectName}>{project.name}</span>
      </button>
    </li>
  )
}

function UnassignedNavItem({ onProjectJump }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'project-unassigned',
    data: { type: 'project', projectId: null },
  })

  return (
    <li>
      <button
        ref={setNodeRef}
        className={`${styles.projectBtn} ${styles.unassignedBtn} ${isOver ? styles.projectDropTarget : ''}`}
        onClick={() => onProjectJump('unassigned')}
      >
        <span className={`${styles.projectDot} ${styles.unassignedDot}`} />
        <span className={styles.projectName}>Unassigned</span>
      </button>
    </li>
  )
}

export function Sidebar({ activeView, onViewChange, onProjectJump, projects = [], tasks = [], onExport, isOpen, onClose }) {
  const captureCount = tasks.filter(t => t.status === 'capture' && !t.completed).length
  const regularProjects = [...projects]
    .filter(p => p.name !== 'App Ideas')
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  const appIdeasProject = projects.find(p => p.name === 'App Ideas') ?? null

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}
      <nav className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoArea}>
          <span className={styles.logo}>Tasks</span>
        </div>
        <ul className={styles.nav}>
          {STATUS_NAV_ITEMS.map(item => (
            <StatusNavItem
              key={item.id}
              item={item}
              active={activeView === item.id}
              onViewChange={onViewChange}
              count={item.id === 'capture' ? captureCount : 0}
            />
          ))}
          <li>
            <button
              className={`${styles.navBtn} ${activeView === 'projects' ? styles.active : ''}`}
              onClick={() => onViewChange('projects')}
            >
              Projects
            </button>
            <ul className={styles.projectList}>
              {regularProjects.map(p => (
                <ProjectNavItem key={p.id} project={p} onProjectJump={onProjectJump} />
              ))}
              {appIdeasProject && (
                <ProjectNavItem
                  key={appIdeasProject.id}
                  project={appIdeasProject}
                  onProjectJump={onProjectJump}
                  utility
                />
              )}
              <UnassignedNavItem onProjectJump={onProjectJump} />
            </ul>
          </li>
        </ul>
        <div className={styles.footer}>
          {onExport && (
            <button className={styles.exportBtn} onClick={onExport}>
              Export .md
            </button>
          )}
          <button
            className={styles.signOutBtn}
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </nav>
    </>
  )
}
