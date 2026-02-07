'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Pencil, Check, X } from 'lucide-react'

interface NicknameEditorProps {
  currentNickname: string
  initial: string  // avatar initial
}

export function NicknameEditor({ currentNickname, initial }: NicknameEditorProps) {
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState(currentNickname)
  const [displayName, setDisplayName] = useState(currentNickname)

  const updateNickname = trpc.user.updateNickname.useMutation({
    onSuccess: (data) => {
      setDisplayName(data.nickname ?? nickname)
      setEditing(false)
    },
  })

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
        <button
          onClick={() => { setNickname(displayName); setEditing(true) }}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          title="Edit nickname"
        >
          <Pencil size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={30}
        className="text-2xl font-bold text-slate-900 border-b-2 border-uw-red outline-none bg-transparent w-48"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter' && nickname.trim()) {
            updateNickname.mutate({ nickname: nickname.trim() })
          }
          if (e.key === 'Escape') {
            setEditing(false)
          }
        }}
      />
      <button
        onClick={() => {
          if (nickname.trim()) {
            updateNickname.mutate({ nickname: nickname.trim() })
          }
        }}
        disabled={!nickname.trim() || updateNickname.isPending}
        className="text-green-600 hover:text-green-700 p-1 disabled:opacity-50"
      >
        <Check size={16} />
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-slate-400 hover:text-slate-600 p-1"
      >
        <X size={16} />
      </button>
      {updateNickname.isError && (
        <span className="text-xs text-red-500">Failed to update</span>
      )}
    </div>
  )
}
