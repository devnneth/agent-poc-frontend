import { useState, useEffect, useCallback } from 'react'
import { memoService } from '../../../services/memos/memo-service'
import { useAuthSession } from '../../auth/hooks/use-auth-session'

/**
 * 메모 목록 상태와 검색, 추가 로직을 관리하는 커스텀 훅
 */
export function useMemos() {
  const { session } = useAuthSession()
  const [memos, setMemos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const loadMemos = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const data = await memoService.getMemos(session.user.id, searchQuery)
      setMemos(data)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, searchQuery])

  useEffect(() => {
    loadMemos()
  }, [loadMemos])

  const handleUpdateMemo = async (id, updates) => {
    const updated = await memoService.updateMemo(id, updates, session?.access_token)
    setMemos(prev => prev.map(m => m.id === id ? updated : m))
  }

  const handleDeleteMemo = async (id) => {
    await memoService.deleteMemo(id)
    setMemos(prev => prev.filter(m => m.id !== id))
  }

  const handleCreateMemo = async (memoData) => {
    if (!session?.user?.id) return
    const newMemo = await memoService.createNewMemo(session.user.id, session.access_token)
    // 빈 메모 생성 후 즉시 업데이트 (사용자 입력 반영)
    const updated = await memoService.updateMemo(newMemo.id, memoData, session.access_token)
    setMemos(prev => [updated, ...prev])
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  return {
    memos,
    loading,
    searchQuery,
    handleCreateMemo,
    handleUpdateMemo,
    handleDeleteMemo,
    handleSearch,
    refreshMemos: loadMemos
  }
}
