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
    <header className="sticky top-0 z-30 h-14 border-b border-slate-200/80 bg-white/85 backdrop-blur-md flex items-center px-4 sm:px-6 gap-3">
      {/* Mobile: Logo */}
      <Link href="/dashboard" className="md:hidden flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-700 flex items-center justify-center text-xs text-white font-bold shadow-xs">
          ❄️
        </div>
      </Link>

      {/* Group Switcher */}
      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-slate-300 text-sm">/</span>
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
            <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-sky-50/70 transition-colors border border-transparent hover:border-sky-200/60 cursor-pointer">
              <Avatar className="h-7 w-7 ring-1 ring-slate-200">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-[11px] bg-sky-50 text-sky-700 font-semibold">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-xs font-semibold text-slate-700">{profile.display_name}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 glass-popover p-1.5">
            <DropdownMenuLabel className="px-2.5 py-2">
              <div className="text-xs font-semibold text-slate-900">{profile.display_name}</div>
              <div className="text-slate-400 text-[11px] font-normal">@{profile.username}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
            <DropdownMenuItem asChild className="rounded-lg text-xs py-2 px-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer">
              <Link href="/settings">Account Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg text-xs py-2 px-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer">
              <Link href="/notifications">Notifications</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
            <form action={logoutAction}>
              <DropdownMenuItem asChild className="rounded-lg text-xs py-2 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer">
                <button type="submit" className="w-full text-left font-medium">
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
