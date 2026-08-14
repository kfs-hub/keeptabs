'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, Shield } from 'lucide-react'
import { switchGroupAction } from '@/lib/groups/actions'
import { GroupSwitchOverlay } from '@/components/layout/group-switch-overlay'
import { toast } from 'sonner'

interface SelectGroupCardProps {
  groupId: string
  groupName: string
  currency: string
  role: string
  isActive: boolean
}

export function SelectGroupCard({
  groupId,
  groupName,
  currency,
  role,
  isActive,
}: SelectGroupCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [switching, setSwitching] = useState(false)

  function handleSelect() {
    setSwitching(true)
    startTransition(async () => {
      const res = await switchGroupAction(groupId)
      if (res.error) {
        toast.error(res.error)
        setSwitching(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <>
      <GroupSwitchOverlay isVisible={switching} groupName={groupName} />

      <Card
        onClick={handleSelect}
        className={`cursor-pointer transition-all duration-150 border hover:border-zinc-300 bg-white ${
          isActive
            ? 'border-zinc-900 ring-1 ring-zinc-900 shadow-xs'
            : 'border-zinc-200'
        }`}
      >
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-sm font-semibold text-white shrink-0">
              {groupName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900 truncate text-sm">{groupName}</h3>
                {isActive && (
                  <span className="text-[10px] bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                <span className="capitalize flex items-center gap-1">
                  {['admin', 'owner'].includes(role) && <Shield className="h-3 w-3 text-zinc-700" />}
                  {role}
                </span>
                <span>•</span>
                <span>{currency}</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            disabled={isPending}
            className="shrink-0 gap-1.5"
            variant={isActive ? 'default' : 'outline'}
          >
            {isPending ? (
              'Opening...'
            ) : (
              <>
                Open <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

