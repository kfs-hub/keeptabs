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
import { cn, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GroupSwitcher } from '@/components/layout/group-switcher'
import { logoutAction } from '@/app/(auth)/actions'
import type { Profile, MemberRole, Group } from '@/types/database'

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
  groups?: Group[]
  activeGroup?: Group
}

export function Sidebar({ profile, groupName, role, groups, activeGroup }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = ['admin', 'owner'].includes(role)

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin)
  )

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-zinc-200 bg-white h-screen sticky top-0">
      {/* Logo & Group Switcher */}
      <div className="p-4 border-b border-zinc-200 space-y-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-700 flex items-center justify-center text-base">
            💸
          </div>
          <div className="font-bold text-zinc-900 text-sm">Keep Tabs</div>
        </Link>

        {groups && activeGroup && (
          <GroupSwitcher groups={groups} activeGroup={activeGroup} />
        )}
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
                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                )}
              >
                <span className={cn(isActive ? 'text-violet-700' : 'text-zinc-400')}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-600" />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-zinc-200">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-50">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-900 truncate">{profile.display_name}</div>
            <div className="text-xs text-zinc-400 truncate">@{profile.username}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-zinc-400 hover:text-red-600 transition-colors p-1 rounded"
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
