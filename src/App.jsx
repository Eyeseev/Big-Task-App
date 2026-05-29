import { useState, useEffect, useRef } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core'
import styles from './App.module.css'
import { Sidebar } from './components/Sidebar'
import { useAppData } from './hooks/useAppData'
import { downloadMarkdown } from './data/export'
import { upsertUiState } from './data/supabaseApi'
import { ImportBanner } from './components/ImportBanner'
import { TodayView } from './views/TodayView'
import { NextView } from './views/NextView'
import { WaitingView } from './views/WaitingView'
import { SomedayView } from './views/SomedayView'
import { BacklogView } from './views/BacklogView'
import { ProjectsView } from './views/ProjectsView'
import { CaptureView } from './views/CaptureView'
import { AppIdeasView } from './views/AppIdeasView'

const VALID_VIEWS = new Set(['capture', 'today', 'next', 'waiting', 'someday', 'projects', 'backlog', 'app_ideas'])
const VIEW_KEY = 'vic-rod-tasks-app-active-view'

function loadActiveView() {
  try {
    const stored = localStorage.getItem(VIEW_KEY)
    return stored && VALID_VIEWS.has(stored) ? stored : 'today'
  } catch {
    return 'today'
  }
}

function App({ userId }) {
  const [activeView, setActiveView] = useState(loadActiveView)
  const [draggingTask, setDraggingTask] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    data,
    loading,
    loadError,
    saveError,
    uiState,
    addTask, updateTask, deleteTask, toggleComplete,
    addProject, updateProject, deleteProject,
    addSubtask, deleteSubtask, toggleSubtaskComplete, promoteSubtask,
  } = useAppData(userId)

  const { tasks, projects } = data

  // Apply active view from Supabase once after initial load completes.
  // A ref prevents re-applying on subsequent renders (e.g. after user changes view).
  const uiStateApplied = useRef(false)
  useEffect(() => {
    if (loading || uiStateApplied.current) return
    uiStateApplied.current = true
    if (uiState?.activeView && VALID_VIEWS.has(uiState.activeView)) {
      setActiveView(uiState.activeView)
      try { localStorage.setItem(VIEW_KEY, uiState.activeView) } catch {}
    }
  }, [loading, uiState])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleViewChange(view) {
    setActiveView(view)
    setSidebarOpen(false)
    try { localStorage.setItem(VIEW_KEY, view) } catch {}
    upsertUiState(userId, { activeView: view }).catch(console.error)
  }

  function handleDragStart(event) {
    const task = tasks.find(t => t.id === event.active.id)
    setDraggingTask(task ?? null)
  }

  function handleExport() {
    downloadMarkdown(tasks, projects)
  }

  function handleDragEnd(event) {
    setDraggingTask(null)
    const { active, over } = event
    if (!over?.data?.current) return

    const target = over.data.current
    if (target.type === 'status') {
      updateTask(active.id, { status: target.status })
    } else if (target.type === 'project') {
      updateTask(active.id, { projectId: target.projectId })
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading…</div>
  }

  const sharedProps = {
    tasks, projects,
    addTask, updateTask, deleteTask, toggleComplete,
    addProject, updateProject, deleteProject,
    addSubtask, deleteSubtask, toggleSubtaskComplete, promoteSubtask,
  }

  function renderView() {
    switch (activeView) {
      case 'capture':   return <CaptureView {...sharedProps} />
      case 'today':     return <TodayView {...sharedProps} />
      case 'next':      return <NextView {...sharedProps} />
      case 'waiting':   return <WaitingView {...sharedProps} />
      case 'someday':   return <SomedayView {...sharedProps} />
      case 'backlog':   return <BacklogView {...sharedProps} />
      case 'projects':  return <ProjectsView {...sharedProps} />
      case 'app_ideas': return <AppIdeasView {...sharedProps} />
      default:          return <TodayView {...sharedProps} />
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={styles.app}>
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          projects={projects}
          onExport={handleExport}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className={styles.main}>
          <div className={styles.mobileHeader}>
            <button
              className={styles.hamburger}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
            </button>
          </div>
          {loadError && <div className={styles.errorBanner}>{loadError}</div>}
          {saveError && <div className={styles.saveError}>{saveError}</div>}
          {!loading && (
            <ImportBanner
              userId={userId}
              cloudProjectCount={projects.length}
              cloudTaskCount={tasks.length}
            />
          )}
          {renderView()}
        </main>
      </div>
      <DragOverlay dropAnimation={null}>
        {draggingTask && (
          <div className={styles.dragOverlay}>
            {draggingTask.text}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default App
