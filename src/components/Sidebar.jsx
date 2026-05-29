import { useDroppable } from '@dnd-kit/core'
import { supabase } from '../data/supabaseClient'
import styles from './Sidebar.module.css'

const STATUS_NAV_ITEMS = [
  { id: 'today',   label: 'Today' },
  { id: 'next',    label: 'Next' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'backlog', label: 'Later' },
  { id: 'someday', label: 'Someday' },
]

function StatusNavItem({ item, active, onViewChange }) {
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
      </button>
    </li>
  )
}

function ProjectNavItem({ project, onViewChange }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `project-${project.id}`,
    data: { type: 'project', projectId: project.id },
  })

  return (
    <li>
      <button
        ref={setNodeRef}
        className={`${styles.projectBtn} ${isOver ? styles.projectDropTarget : ''}`}
        onClick={() => onViewChange('projects')}
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

function UnassignedNavItem({ onViewChange }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'project-unassigned',
    data: { type: 'project', projectId: null },
  })

  return (
    <li>
      <button
        ref={setNodeRef}
        className={`${styles.projectBtn} ${styles.unassignedBtn} ${isOver ? styles.projectDropTarget : ''}`}
        onClick={() => onViewChange('projects')}
      >
        <span className={`${styles.projectDot} ${styles.unassignedDot}`} />
        <span className={styles.projectName}>Unassigned</span>
      </button>
    </li>
  )
}

export function Sidebar({ activeView, onViewChange, projects = [], onExport, isOpen, onClose }) {
  const sortedProjects = [...projects].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

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
              {sortedProjects.map(p => (
                <ProjectNavItem key={p.id} project={p} onViewChange={onViewChange} />
              ))}
              <UnassignedNavItem onViewChange={onViewChange} />
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
