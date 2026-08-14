'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  AlertTriangle,
  ScrollText,
  Trophy,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/fines', label: 'Fines', icon: <AlertTriangle className="h-5 w-5" /> },
  { href: '/rules', label: 'Rules', icon: <ScrollText className="h-5 w-5" /> },
  { href: '/leaderboard', label: 'Board', icon: <Trophy className="h-5 w-5" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 h-15">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors duration-150',
                  isActive ? 'text-sky-700 font-semibold' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <div className={cn('p-1 rounded-lg transition-colors', isActive && 'bg-sky-50 text-sky-700')}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 w-8 h-0.5 rounded-full bg-sky-500 shadow-xs shadow-sky-400/50"
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
