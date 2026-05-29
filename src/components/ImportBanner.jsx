import { useState } from 'react'
import { importLocalData } from '../data/supabaseApi'
import styles from './ImportBanner.module.css'

const LOCAL_KEY = 'vic-rod-tasks-app'
const IMPORTED_FLAG = 'vic-rod-tasks-app-imported-to-supabase'

function readLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const tasks = parsed.tasks ?? []
    const projects = parsed.projects ?? []
    if (!Array.isArray(tasks) || !Array.isArray(projects)) return null
    if (tasks.length === 0 && projects.length === 0) return null
    return { tasks, projects }
  } catch {
    return null
  }
}

function alreadyImported() {
  try { return !!localStorage.getItem(IMPORTED_FLAG) } catch { return false }
}

function markImported() {
  try { localStorage.setItem(IMPORTED_FLAG, '1') } catch {}
}

export function ImportBanner({ userId, cloudProjectCount, cloudTaskCount }) {
  const [localData] = useState(() => alreadyImported() ? null : readLocalData())
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [status, setStatus] = useState('idle') // idle | importing | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [importedCounts, setImportedCounts] = useState(null)

  const [dismissed, setDismissed] = useState(false)

  // No local data (flag already set, or localStorage is empty/absent) → render nothing.
  if (!localData || dismissed) return null

  if (status === 'success') {
    return (
      <div className={styles.success}>
        Import complete — {importedCounts?.projectCount ?? 0} project{importedCounts?.projectCount !== 1 ? 's' : ''} and {importedCounts?.taskCount ?? 0} task{importedCounts?.taskCount !== 1 ? 's' : ''} uploaded. Reloading…
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.importError}>
        Import failed: {errorMsg}{' '}
        <button className={styles.btnGhost} onClick={() => setStatus('idle')}>Try again</button>
      </div>
    )
  }

  const localProjects = localData?.projects?.length ?? 0
  const localTasks = localData?.tasks?.length ?? 0
  const cloudHasData = cloudProjectCount > 0 || cloudTaskCount > 0

  async function handleImport(data) {
    setStatus('importing')
    try {
      const counts = await importLocalData(userId, data)
      setImportedCounts(counts)
      markImported()
      setStatus('success')
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setErrorMsg(err?.message ?? 'Unknown error')
      setStatus('error')
    }
  }

  function handleAutoImport() {
    handleImport(localData)
  }

  function handlePasteImport() {
    setPasteError('')
    let parsed
    try {
      parsed = JSON.parse(pasteText)
    } catch {
      setPasteError('Invalid JSON — paste the full object from DevTools.')
      return
    }
    const tasks = parsed?.tasks
    const projects = parsed?.projects
    if (!Array.isArray(tasks) || !Array.isArray(projects)) {
      setPasteError('JSON must have "tasks" and "projects" arrays at the top level.')
      return
    }
    handleImport({ tasks, projects })
  }

  function renderPasteForm() {
    return (
      <>
        <p style={{ marginTop: '0.5rem', marginBottom: '0.375rem' }}>
          Open DevTools → Application → Local Storage → select the correct origin → copy the value of{' '}
          <code>vic-rod-tasks-app</code> and paste it below.
        </p>
        <textarea
          className={styles.pasteArea}
          placeholder='{"tasks": [...], "projects": [...]}'
          value={pasteText}
          onChange={e => { setPasteText(e.target.value); setPasteError('') }}
        />
        {pasteError && <div className={styles.pasteError}>{pasteError}</div>}
        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={handlePasteImport}
            disabled={status === 'importing' || !pasteText.trim()}
          >
            {status === 'importing' ? 'Importing…' : 'Import pasted data'}
          </button>
          <button className={styles.btnGhost} onClick={() => { setShowPaste(false); setPasteText(''); setPasteError('') }}>
            Cancel
          </button>
        </div>
      </>
    )
  }

  return (
    <div className={styles.banner}>
      <div className={styles.title}>You have local data that hasn't been uploaded</div>
      <div className={styles.counts}>
        Local: {localProjects} project{localProjects !== 1 ? 's' : ''}, {localTasks} task{localTasks !== 1 ? 's' : ''}{' '}
        · Cloud: {cloudProjectCount} project{cloudProjectCount !== 1 ? 's' : ''}, {cloudTaskCount} task{cloudTaskCount !== 1 ? 's' : ''}
      </div>
      {cloudHasData && (
        <div className={styles.warn}>
          Supabase already has data. Importing will upsert by ID — matching IDs overwrite cloud records,
          new IDs are added. No cloud data is deleted.
        </div>
      )}
      {!showPaste ? (
        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={handleAutoImport}
            disabled={status === 'importing'}
          >
            {status === 'importing' ? 'Importing…' : 'Import local data'}
          </button>
          <button className={styles.btnSecondary} onClick={() => setShowPaste(true)}>
            Paste JSON manually
          </button>
          <button className={styles.btnGhost} onClick={() => { markImported(); setDismissed(true) }}>
            Dismiss
          </button>
        </div>
      ) : (
        renderPasteForm()
      )}
    </div>
  )
}
