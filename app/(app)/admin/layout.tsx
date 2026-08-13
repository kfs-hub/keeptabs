import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, Users, BarChart2, Settings, FileText, AlertTriangle } from 'lucide-react'

import { getActiveGroup } from '@/lib/groups/get-active-group'

const adminNav = [
  { href: '/admin/disputes',  label: 'Disputes',  icon: <AlertTriangle className="h-4 w-4" /> },
  { href: '/admin/members',   label: 'Members',   icon: <Users className="h-4 w-4" /> },
  { href: '/admin/settings',  label: 'Settings',  icon: <Settings className="h-4 w-4" /> },
  { href: '/admin/audit',     label: 'Audit Log', icon: <FileText className="h-4 w-4" /> },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await getActiveGroup()

  if (!['admin', 'owner'].includes(role)) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Admin header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Shield className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-xs text-white/40">
            {role === 'owner' ? '👑 Group Owner' : '🛡️ Group Admin'}
          </p>
        </div>
      </div>

      {/* Sub nav */}
      <div className="flex gap-2 flex-wrap">
        {adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/8 hover:border-violet-500/30 transition-all"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  )
}
