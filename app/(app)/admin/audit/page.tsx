import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Admin — Audit Log' }

const actionLabels: Record<string, string> = {
  dispute_approved:         'Dispute denied — fine kept',
  dispute_cancelled:        'Dispute accepted — fine cancelled',
  fine_modified:            'Fine amount modified',
  member_removed:           'Member removed',
  role_changed:             'Member role changed',
  group_settings_updated:   'Group settings updated',
  invite_code_regenerated:  'Invite code regenerated',
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const pageSize = 30

  const supabase = await createClient()

  const { groupId, role } = await getActiveGroup()
  if (!['admin', 'owner'].includes(role)) redirect('/dashboard')

  const { data: logs, count } = await supabase
    .from('audit_logs')
    .select('*, actor:profiles!audit_logs_actor_id_fkey(display_name, username)', { count: 'exact' })
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Audit Log</h2>
        <span className="text-xs text-zinc-500">{count ?? 0} entries</span>
      </div>

      {!logs?.length ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-xs">
          <FileText className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No admin actions recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs divide-y divide-zinc-100">
          {logs.map((log) => {
            const actor = log.actor as any
            const label = actionLabels[log.action] ?? log.action
            return (
              <div key={log.id} className="flex items-start gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-900">{label}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    by <span className="text-zinc-600 font-medium">{actor?.display_name ?? 'Unknown'}</span>
                    {' '}·{' '}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span className="font-mono text-zinc-400">
                        {JSON.stringify(log.metadata).slice(0, 60)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-zinc-400">{formatRelativeTime(log.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="text-xs text-zinc-600 hover:text-zinc-900 transition-colors">← Previous</a>
          )}
          <span className="text-xs text-zinc-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={`?page=${page + 1}`} className="text-xs text-zinc-600 hover:text-zinc-900 transition-colors">Next →</a>
          )}
        </div>
      )}
    </div>
  )
}
