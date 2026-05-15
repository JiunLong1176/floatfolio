'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RecoveryRedirect() {
  const router = useRouter()
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('type') !== 'recovery') return

    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token') ?? ''
    if (!accessToken) return

    const supabase = createClient()
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => router.replace('/auth/reset-password'))
  }, [router])
  return null
}
