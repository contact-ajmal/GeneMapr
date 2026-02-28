import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import DNAHelix from './backgrounds/DNAHelix'
import ParticleField from './backgrounds/ParticleField'
import TopLoadingBar from './ui/TopLoadingBar'
import Sidebar, { SIDEBAR_EXPANDED_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar'
import MobileNav from './MobileNav'
import TopHeader from './TopHeader'
import CommandPalette from './CommandPalette'
import WelcomeModal from './WelcomeModal'
import type { Variant } from '../types/variant'

interface LayoutProps {
  children: React.ReactNode
  onVariantSelect?: (variant: Variant) => void
  activeProfile?: string | null
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

export default function Layout({ children, onVariantSelect, activeProfile }: LayoutProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_EXPANDED_WIDTH)
  const isDesktop = useIsDesktop()

  // Watch sidebar state to adjust content offset
  useEffect(() => {
    const checkSidebar = () => {
      const collapsed = localStorage.getItem('genemaprsidebar_collapsed') === 'true'
      setSidebarWidth(collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH)
    }

    checkSidebar()
    // Listen for storage changes (sidebar toggle)
    window.addEventListener('storage', checkSidebar)

    // Poll for sidebar changes since same-tab storage events don't fire
    const interval = setInterval(checkSidebar, 200)

    return () => {
      window.removeEventListener('storage', checkSidebar)
      clearInterval(interval)
    }
  }, [])

  // Global keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpenCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Top Loading Bar */}
      <TopLoadingBar />

      {/* DNA Helix Background */}
      <DNAHelix />

      {/* Particle Field Background */}
      <ParticleField />

      {/* Sidebar (desktop) */}
      <Sidebar />

      {/* Top Header */}
      <TopHeader
        sidebarWidth={isDesktop ? sidebarWidth : 0}
        onOpenCommandPalette={handleOpenCommandPalette}
        activeProfile={activeProfile}
      />

      {/* Mobile Bottom Nav */}
      <MobileNav />

      {/* Main Content */}
      <motion.main
        className="relative z-10 pt-14 pb-20 lg:pb-8 min-h-screen"
        animate={{
          paddingLeft: isDesktop ? sidebarWidth : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-6 py-6 max-w-[1600px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-4 border-t border-dna-cyan/5">
          <div className="container mx-auto px-6 max-w-[1600px]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <p className="font-body flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-dna-cyan/10 text-dna-cyan font-mono text-[10px]">
                  v1.0
                </span>
                GeneMapr | For Research Use Only
              </p>
              <div className="flex items-center gap-4 font-body">
                <button className="hover:text-slate-300 transition-colors">Documentation</button>
                <span className="text-slate-700">|</span>
                <button className="hover:text-slate-300 transition-colors">About</button>
                <span className="text-slate-700">|</span>
                <button className="hover:text-slate-300 transition-colors">GitHub</button>
              </div>
            </div>
          </div>
        </footer>
      </motion.main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onVariantSelect={onVariantSelect}
      />

      {/* Welcome Modal (first visit) */}
      <WelcomeModal />
    </div>
  )
}
