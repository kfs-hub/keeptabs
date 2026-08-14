'use client'

import Link from 'next/link'
import { ChevronDown, Receipt } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
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
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 bg-white/90 backdrop-blur-md flex items-center px-4 sm:px-6 gap-3">
      {/* Mobile: Logo */}
      <Link href="/dashboard" className="md:hidden flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-2xs">
          <Receipt className="h-4 w-4" />
        </div>
      </Link>

      {/* Group Switcher */}
      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-zinc-300 text-sm">/</span>
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
            <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200 cursor-pointer">
              <Avatar className="h-7 w-7 ring-1 ring-zinc-200">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-[11px] bg-zinc-100 text-zinc-800 font-semibold">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-xs font-semibold text-zinc-800">{profile.display_name}</span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 glass-popover p-1.5">
            <DropdownMenuLabel className="px-2.5 py-2">
              <div className="text-xs font-semibold text-zinc-900">{profile.display_name}</div>
              <div className="text-zinc-400 text-[11px] font-normal">@{profile.username}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-zinc-100" />
            <DropdownMenuItem asChild className="rounded-md text-xs py-2 px-2.5 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 cursor-pointer">
              <Link href="/settings">Account Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-md text-xs py-2 px-2.5 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 cursor-pointer">
              <Link href="/notifications">Notifications</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  await logoutAction()
                } catch {
                  // redirect throws in Next.js
                } finally {
                  window.location.href = '/login'
                }
              }}
              className="rounded-md text-xs py-2 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 cursor-pointer font-medium"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
