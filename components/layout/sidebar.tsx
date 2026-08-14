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
  Receipt,
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
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/fines', label: 'Fines', icon: <AlertTriangle className="h-4 w-4" /> },
  { href: '/rules', label: 'Rules', icon: <ScrollText className="h-4 w-4" /> },
  { href: '/members', label: 'Members', icon: <Users className="h-4 w-4" /> },
  { href: '/payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" /> },
  { href: '/stats', label: 'Statistics', icon: <BarChart3 className="h-4 w-4" /> },
  { href: '/leaderboard', label: 'Leaderboard', icon: <Trophy className="h-4 w-4" /> },
  { href: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  { href: '/admin', label: 'Admin', icon: <Shield className="h-4 w-4" />, adminOnly: true },
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
      <div className="p-4 border-b border-zinc-100 space-y-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-1 py-0.5 group">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-2xs">
            <Receipt className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-zinc-900 text-sm tracking-tight">Keep Tabs</div>
            <div className="text-[10px] text-zinc-400 font-medium">Fine & Tab Tracker</div>
          </div>
        </Link>

        {groups && activeGroup && (
          <GroupSwitcher groups={groups} activeGroup={activeGroup} />
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Menu
        </div>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-100',
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                )}
              >
                <span className={cn(
                  'transition-colors',
                  isActive ? 'text-zinc-950' : 'text-zinc-400'
                )}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200/80 shadow-2xs">
          <Avatar className="h-7 w-7 shrink-0 ring-1 ring-zinc-100">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-800 font-semibold">
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-zinc-900 truncate">{profile.display_name}</div>
            <div className="text-[10px] text-zinc-400 truncate">@{profile.username}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-zinc-400 hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
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
