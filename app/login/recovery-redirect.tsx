'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RecoveryRedirect() {
  const router = useRouter()
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('type') === 'recovery') {
      router.replace('/auth/reset-password' + window.location.hash)
    }
  }, [router])
  return null
}
