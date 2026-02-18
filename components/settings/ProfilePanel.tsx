'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/profile'
import { Camera, Loader2, Check, AlertCircle } from 'lucide-react'

const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface ProfilePanelProps {
  profile: Profile
  userId: string
}

export default function ProfilePanel({ profile, userId }: ProfilePanelProps) {
  const [fullName, setFullName]   = useState(profile.full_name ?? '')
  const [username, setUsername]   = useState(profile.username ?? '')
  const [bio, setBio]             = useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [isSaving, setIsSaving]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be under 2 MB.')
      return
    }

    setIsUploading(true)
    setError(null)

    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setIsUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    // Bust cache
    const busted = `${publicUrl}?t=${Date.now()}`
    setAvatarUrl(busted)

    await supabase
      .from('profiles')
      .update({ avatar_url: busted, updated_at: new Date().toISOString() })
      .eq('id', userId)

    setIsUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSaving(true)

    const { error: saveError } = await supabase.from('profiles').update({
      full_name: fullName.trim() || null,
      username:  username.trim() || null,
      bio:       bio.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)

    if (saveError) {
      setError(saveError.message.includes('unique')
        ? 'That username is already taken.'
        : 'Failed to save. Please try again.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }

    setIsSaving(false)
  }

  const initials = (fullName || profile.email || 'U').slice(0, 2).toUpperCase()

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-lg">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              width={72}
              height={72}
              className="w-18 h-18 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-18 h-18 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            {isUploading ? <Loader2 size={13} className="animate-spin text-slate-500" /> : <Camera size={13} className="text-slate-600 dark:text-slate-300" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Profile photo</p>
          <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP or GIF · max 2 MB</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Display name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="yourhandle"
              maxLength={30}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Letters, numbers, underscores only.</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself…"
            rows={3}
            maxLength={200}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/200</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
      >
        {isSaving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
        {isSaving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
      </button>
    </form>
  )
}
