'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Camera, Save, Key, LogOut, Users, Link2, Eye, EyeOff, BellRing, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials, formatDate } from '@/lib/utils'
import { logoutAction } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/client'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import {
  updateProfileAction,
  uploadAvatarAction,
  updatePasswordFromSettingsAction,
} from './actions'
import type { Profile, Group } from '@/types/database'

interface SettingsClientProps {
  profile: Profile
  groups: Array<Group & { role: string }>
  activeGroupId: string
}

export function SettingsClient({ profile, groups, activeGroupId }: SettingsClientProps) {
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [showPassword, setShowPassword] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    sendTest: sendTestPush,
  } = usePushNotifications()

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileLoading(true)
    const fd = new FormData(e.currentTarget)
    const r = await updateProfileAction(fd)
    if (r.error) toast.error(r.error)
    else toast.success('Profile updated!')
    setProfileLoading(false)
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordLoading(true)
    const fd = new FormData(e.currentTarget)
    const r = await updatePasswordFromSettingsAction(fd)
    if (r.error) toast.error(r.error)
    else {
      toast.success('Password changed!')
      ;(e.target as HTMLFormElement).reset()
    }
    setPasswordLoading(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) { toast.error('File must be under 2MB'); return }

    // Preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setAvatarLoading(true)
    const fd = new FormData()
    fd.set('avatar', file)
    const r = await uploadAvatarAction(fd)
    if (r.error) { toast.error(r.error); setAvatarPreview(profile.avatar_url) }
    else { toast.success('Avatar updated!'); if (r.url) setAvatarPreview(r.url) }
    setAvatarLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Manage your profile, credentials, and groups</p>
      </div>

      {/* Avatar */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-4">Profile Picture</h2>
        <div className="flex items-center gap-5">
          <div className="relative group">
            <Avatar className="h-16 w-16 border border-zinc-200">
              <AvatarImage src={avatarPreview ?? undefined} />
              <AvatarFallback className="text-lg bg-zinc-100 text-zinc-700">{getInitials(profile.display_name)}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-zinc-900 font-semibold">{profile.display_name}</p>
            <p className="text-zinc-400 text-sm">@{profile.username}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fileInputRef.current?.click()}
              loading={avatarLoading}
            >
              <Camera className="h-3.5 w-3.5" />
              Change Photo
            </Button>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-4">Profile Info</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={profile.display_name}
              required
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">@</span>
              <Input
                id="username"
                name="username"
                defaultValue={profile.username}
                className="pl-7"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
              />
            </div>
          </div>
          <Button type="submit" loading={profileLoading} className="w-full">
            <Save className="h-4 w-4" />
            Save Profile
          </Button>
        </form>
      </div>

      {/* Push Notifications */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
              <BellRing className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">Device Notifications</h2>
              <p className="text-[11px] text-zinc-500">Receive instant alerts for fines, payments, and disputes</p>
            </div>
          </div>
          <Badge
            variant={pushSubscribed ? 'default' : 'ghost'}
            className="text-[10px]"
          >
            {pushSubscribed ? 'Active' : 'Disabled'}
          </Badge>
        </div>

        {!pushSupported ? (
          <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
            Push notifications are not supported on this browser or device.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="push-toggle" className="text-xs font-semibold text-zinc-900 cursor-pointer">
                  Browser Push Notifications
                </Label>
                <p className="text-[11px] text-zinc-500">
                  {pushPermission === 'denied'
                    ? 'Blocked by browser. Allow notifications in site settings.'
                    : pushSubscribed
                    ? 'This browser is registered for real-time push alerts.'
                    : 'Turn on to get notified on this device.'}
                </p>
              </div>
              <Switch
                id="push-toggle"
                checked={pushSubscribed}
                disabled={pushLoading || pushPermission === 'denied'}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    await subscribePush()
                  } else {
                    await unsubscribePush()
                  }
                }}
              />
            </div>

            {pushSubscribed && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={sendTestPush}
                disabled={pushLoading}
              >
                <Send className="h-3.5 w-3.5" />
                Send Test Notification to This Device
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                minLength={8}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat new password"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" variant="outline" loading={passwordLoading} className="w-full">
            <Key className="h-4 w-4" />
            Update Password
          </Button>
        </form>
      </div>

      {/* Groups */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-4">Your Groups</h2>
        <div className="space-y-2 mb-4">
          {groups.map((g) => (
            <div
              key={g.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                g.id === activeGroupId
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-200 bg-white'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{g.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  <Badge
                    variant={g.role === 'owner' ? 'owner' : g.role === 'admin' ? 'admin' : 'member'}
                    className="text-[9px] mr-1"
                  >
                    {g.role}
                  </Badge>
                  Code: <span className="font-mono text-zinc-600">{g.invite_code}</span>
                </p>
              </div>
              {g.id === activeGroupId && (
                <Badge variant="default" className="text-[10px]">Active</Badge>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Link href="/groups/new" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Users className="h-3.5 w-3.5" />
              New Group
            </Button>
          </Link>
          <Link href="/groups/join" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Link2 className="h-3.5 w-3.5" />
              Join Group
            </Button>
          </Link>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-200 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-4">Account</h2>
        <Button
          type="button"
          variant="destructive"
          className="w-full cursor-pointer"
          onClick={async () => {
            try {
              const supabase = createClient()
              await supabase.auth.signOut()
              await logoutAction()
            } catch {
              // Next.js redirect throw
            } finally {
              window.location.href = '/login'
            }
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
