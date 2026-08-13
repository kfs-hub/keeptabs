import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'

import { getActiveGroup } from '@/lib/groups/get-active-group'

export const metadata = { title: 'Admin — Audit Log' }

const actionLabels: Record<string, string> = {
  dispute_approved:         '⚖️ Dispute denied — fine kept',
  dispute_cancelled:        '✅ Dispute accepted — fine cancelled',
  fine_modified:            '✏️ Fine amount modified',
  member_removed:           '🚫 Member removed',
  role_changed:             '🔄 Member role changed',
  group_settings_updated:   '⚙️ Group settings updated',
  invite_code_regenerated:  '🔑 Invite code regenerated',
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
        <h2 className="text-lg font-semibold text-white">📋 Audit Log</h2>
        <span className="text-xs text-white/30">{count ?? 0} entries</span>
      </div>

      {!logs?.length ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No admin actions recorded yet.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
          {logs.map((log) => {
            const actor = log.actor as any
            const label = actionLabels[log.action] ?? log.action
            return (
              <div key={log.id} className="flex items-start gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    by <span className="text-white/60">{actor?.display_name ?? 'Unknown'}</span>
                    {' '}·{' '}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span className="font-mono text-white/30">
                        {JSON.stringify(log.metadata).slice(0, 60)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white/25">{formatRelativeTime(log.created_at)}</p>
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
            <a href={`?page=${page - 1}`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">← Previous</a>
          )}
          <span className="text-xs text-white/30">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={`?page=${page + 1}`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Next →</a>
          )}
        </div>
      )}
    </div>
  )
}
