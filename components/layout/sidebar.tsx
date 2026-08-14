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
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/80 bg-white h-screen sticky top-0 shadow-[1px_0_3px_rgba(15,23,42,0.02)]">
      {/* Logo & Group Switcher */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-1 py-0.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center text-sm shadow-sm shadow-sky-600/25 text-white font-bold transition-transform group-hover:scale-105">
            ❄️
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">Keep Tabs</div>
            <div className="text-[11px] text-sky-600 font-medium">Fine & Tab Tracker</div>
          </div>
        </Link>

        {groups && activeGroup && (
          <GroupSwitcher groups={groups} activeGroup={activeGroup} />
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.25 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-sky-50 text-sky-800 font-semibold shadow-xs border border-sky-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span className={cn(
                  'transition-colors',
                  isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                )}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500 shadow-xs shadow-sky-400/50" />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-slate-100">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-sky-50 text-sky-700 font-semibold">
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">{profile.display_name}</div>
            <div className="text-[11px] text-slate-400 truncate">@{profile.username}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
