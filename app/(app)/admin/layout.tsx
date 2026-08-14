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
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-xs">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Admin Panel</h1>
          <p className="text-xs text-zinc-500 capitalize">
            Group {role}
          </p>
        </div>
      </div>

      {/* Sub nav */}
      <div className="flex gap-1.5 flex-wrap">
        {adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors shadow-xs"
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
