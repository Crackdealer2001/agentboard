'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteAgentButton({
  agentId,
}: {
  agentId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this agent?')
    if (!confirmed) return

    setLoading(true)

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        marginTop: 12,
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #dc2626',
        background: 'transparent',
        color: '#dc2626',
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  )
}