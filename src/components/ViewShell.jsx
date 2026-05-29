import styles from './ViewShell.module.css'

export function ViewShell({ title, headerRight, children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {headerRight && <div className={styles.headerRight}>{headerRight}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}
