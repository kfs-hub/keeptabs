'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, Shield } from 'lucide-react'
import { switchGroupAction } from '@/lib/groups/actions'
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

  function handleSelect() {
    startTransition(async () => {
      const res = await switchGroupAction(groupId)
      if (res.error) {
        toast.error(res.error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <Card
      onClick={handleSelect}
      className={`cursor-pointer transition-all duration-200 border hover:border-violet-500/50 hover:bg-white/5 ${
        isActive
          ? 'bg-violet-600/10 border-violet-500/40 shadow-lg shadow-violet-500/10'
          : 'bg-white/3 border-white/10'
      }`}
    >
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-lg font-bold text-white shadow-md shrink-0">
            {groupName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate text-base">{groupName}</h3>
              {isActive && (
                <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
              <span className="capitalize flex items-center gap-1">
                {['admin', 'owner'].includes(role) && <Shield className="h-3 w-3 text-amber-400" />}
                {role}
              </span>
              <span>•</span>
              <span>Currency: {currency}</span>
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
              Enter <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
