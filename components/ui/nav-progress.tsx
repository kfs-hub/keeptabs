'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function NavProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // When route changes complete, stop loading
    setLoading(false)
    setProgress(100)
    const t = setTimeout(() => setProgress(0), 400)
    return () => clearTimeout(t)
  }, [pathname, searchParams])

  // We intercept link clicks to start the bar early
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      // Internal navigation — start progress bar
      setLoading(true)
      setProgress(15)
      // Simulate crawl
      const t1 = setTimeout(() => setProgress(40), 300)
      const t2 = setTimeout(() => setProgress(65), 700)
      const t3 = setTimeout(() => setProgress(80), 1200)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <AnimatePresence>
      {(loading || progress === 100) && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="h-full bg-violet-700"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: progress === 100 ? 0.2 : 0.8, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
