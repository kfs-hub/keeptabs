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
          className={`flex items-center gap-2 rounded-xl transition-all border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer ${
            compact ? 'px-2.5 py-1.5 text-xs bg-slate-50/80 font-medium' : 'w-full px-3 py-2 text-sm bg-white font-medium shadow-2xs'
          }`}
          disabled={isPending}
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs">
            {activeGroup.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-800 truncate max-w-[120px] sm:max-w-[160px] text-left">
            {activeGroup.name}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-auto" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60 glass-popover p-1.5">
        <DropdownMenuLabel className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-2 py-1.5">
          Switch Group
        </DropdownMenuLabel>
        
        {groups.map((group) => {
          const isActive = group.id === activeGroup.id
          return (
            <DropdownMenuItem
              key={group.id}
              onClick={() => handleSwitch(group.id)}
              className={`flex items-center justify-between cursor-pointer py-2 px-2.5 rounded-lg text-xs transition-colors ${
                isActive ? 'bg-indigo-50/80 text-indigo-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-5.5 h-5.5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">
                  {group.name}
                </span>
              </div>
              {isActive && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 ml-2" />}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

        <DropdownMenuItem asChild className="rounded-lg text-xs py-1.5 px-2.5 text-indigo-600 hover:bg-indigo-50 cursor-pointer">
          <Link href="/groups/select" className="flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Select / View All Groups</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-lg text-xs py-1.5 px-2.5 text-slate-600 hover:bg-slate-50 cursor-pointer">
          <Link href="/groups/new" className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Group</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="rounded-lg text-xs py-1.5 px-2.5 text-slate-600 hover:bg-slate-50 cursor-pointer">
          <Link href="/groups/join" className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>Join Group via Code</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
