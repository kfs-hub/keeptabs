'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'
import { logoutAction } from '@/app/(auth)/actions'
import type { Profile, Group } from '@/types/database'

import { GroupSwitcher } from '@/components/layout/group-switcher'

interface HeaderProps {
  profile: Profile
  group: Group
  unreadNotifications: number
  groups: Group[]
}

export function Header({ profile, group, unreadNotifications, groups }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-md flex items-center px-4 gap-3">
      {/* Mobile: Logo */}
      <Link href="/dashboard" className="md:hidden flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm">
          💸
        </div>
      </Link>

      {/* Group Switcher */}
      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-white/20 text-sm">/</span>
        <GroupSwitcher groups={groups} activeGroup={group} compact />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Real-time Notification Bell */}
        <NotificationBell
          initialUnreadCount={unreadNotifications}
          userId={profile.id}
          groupId={group.id}
        />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm text-white/70">{profile.display_name}</span>
              <ChevronDown className="h-3 w-3 text-white/30" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="font-medium text-white">{profile.display_name}</div>
              <div className="text-white/40 text-xs">@{profile.username}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/notifications">Notifications</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-red-400 hover:text-red-300">
                  Sign Out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
