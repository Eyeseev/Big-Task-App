import { useEffect, useRef } from 'react'

function key(view) { return `scroll:${view}` }

export function useScrollRestore(activeView, loading) {
  // Ref always holds the current view without causing re-renders
  const activeViewRef = useRef(activeView)
  useEffect(() => { activeViewRef.current = activeView })

  // Save on scroll (debounced 200ms) + on page unload — registered once at mount
  useEffect(() => {
    let timer
    const save = () =>
      sessionStorage.setItem(key(activeViewRef.current), String(window.scrollY))
    const onScroll = () => { clearTimeout(timer); timer = setTimeout(save, 200) }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    window.addEventListener('beforeunload', save)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
      window.removeEventListener('beforeunload', save)
    }
  }, [])

  // On view change (or after loading finishes): save old scroll, restore new
  const prevViewRef = useRef(activeView)
  useEffect(() => {
    if (loading) return

    // Save the position we're leaving before switching
    if (prevViewRef.current !== activeView) {
      sessionStorage.setItem(key(prevViewRef.current), String(window.scrollY))
      prevViewRef.current = activeView
    }

    const saved = sessionStorage.getItem(key(activeView))
    const target = saved !== null ? parseInt(saved, 10) : NaN

    if (isNaN(target)) {
      window.scrollTo(0, 0)
      return
    }

    // Retry until the page is tall enough to hold the saved position.
    // Needed for Projects when task cards render asynchronously.
    let attempts = 0
    function tryScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      if (maxScroll >= target || attempts >= 10) {
        window.scrollTo(0, target)
        return
      }
      attempts++
      requestAnimationFrame(tryScroll)
    }
    requestAnimationFrame(tryScroll)
  }, [activeView, loading])
}
