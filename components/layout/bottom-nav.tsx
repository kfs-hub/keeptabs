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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0a14]/95 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 h-16">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-colors duration-150',
                  isActive ? 'text-violet-400' : 'text-white/30'
                )}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400"
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
