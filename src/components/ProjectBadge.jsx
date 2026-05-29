import styles from './ProjectBadge.module.css'

export function ProjectBadge({ project }) {
  if (!project) return null
  return (
    <span
      className={styles.badge}
      style={{
        backgroundColor: project.color + '20',
        color: project.color,
        borderColor: project.color + '55',
      }}
    >
      {project.name}
    </span>
  )
}
