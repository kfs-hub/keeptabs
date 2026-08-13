'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus, Users, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { switchGroupAction } from '@/lib/groups/actions'
import type { Group } from '@/types/database'

interface GroupSwitcherProps {
  groups: Group[]
  activeGroup: Group
  compact?: boolean
}

export function GroupSwitcher({ groups, activeGroup, compact = false }: GroupSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  async function handleSwitch(groupId: string) {
    if (groupId === activeGroup.id) {
      setOpen(false)
      return
    }

    startTransition(async () => {
      const res = await switchGroupAction(groupId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Switched group!')
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 rounded-xl transition-all border border-white/10 hover:border-violet-500/30 hover:bg-white/5 ${
            compact ? 'px-2.5 py-1.5 text-xs bg-white/5' : 'w-full px-3 py-2 text-sm bg-white/3'
          }`}
          disabled={isPending}
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {activeGroup.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-[160px] text-left">
            {activeGroup.name}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-white/40 shrink-0 ml-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 glass-popover p-1">
        <DropdownMenuLabel className="text-xs text-white/40">Switch Group</DropdownMenuLabel>
        
        {groups.map((group) => {
          const isActive = group.id === activeGroup.id
          return (
            <DropdownMenuItem
              key={group.id}
              onClick={() => handleSwitch(group.id)}
              className="flex items-center justify-between cursor-pointer py-2 px-2.5 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <span className={`text-sm truncate ${isActive ? 'font-semibold text-white' : 'text-white/70'}`}>
                  {group.name}
                </span>
              </div>
              {isActive && <Check className="h-4 w-4 text-violet-400 shrink-0 ml-2" />}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/groups/select" className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 py-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Select / View All Groups</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/groups/new" className="flex items-center gap-2 text-xs text-white/70 hover:text-white py-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Group</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/groups/join" className="flex items-center gap-2 text-xs text-white/70 hover:text-white py-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>Join Group via Code</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
