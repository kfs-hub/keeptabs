'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  AlertTriangle,
  ScrollText,
  Users,
  CreditCard,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { logoutAction } from '@/app/(auth)/actions'
import type { Profile, MemberRole } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/fines', label: 'Fines', icon: <AlertTriangle className="h-5 w-5" /> },
  { href: '/rules', label: 'Rules', icon: <ScrollText className="h-5 w-5" /> },
  { href: '/members', label: 'Members', icon: <Users className="h-5 w-5" /> },
  { href: '/payments', label: 'Payments', icon: <CreditCard className="h-5 w-5" /> },
  { href: '/stats', label: 'Statistics', icon: <BarChart3 className="h-5 w-5" /> },
  { href: '/leaderboard', label: 'Leaderboard', icon: <Trophy className="h-5 w-5" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  { href: '/admin', label: 'Admin', icon: <Shield className="h-5 w-5" />, adminOnly: true },
]

interface SidebarProps {
  profile: Profile
  groupName: string
  role: MemberRole
}

export function Sidebar({ profile, groupName, role }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = ['admin', 'owner'].includes(role)

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin)
  )

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/5 bg-[#0a0a14] h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-base shadow-lg shadow-violet-500/30">
            💸
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-none">Keep Tabs</div>
            <div className="text-xs text-white/40 mt-0.5 truncate max-w-[130px]">{groupName}</div>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <span className={cn(isActive ? 'text-violet-400' : 'text-white/30')}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{profile.display_name}</div>
            <div className="text-xs text-white/40 truncate">@{profile.username}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-white/30 hover:text-red-400 transition-colors p-1 rounded"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
