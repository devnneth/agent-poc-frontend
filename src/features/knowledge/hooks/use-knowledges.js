import { useState, useCallback, useEffect } from 'react'
import { knowledgeService } from '../../../services/knowledge/knowledge-service'
import { useAuthSession } from '../../auth/hooks/use-auth-session'

export function useKnowledges() {
  const { session } = useAuthSession()
  const [knowledges, setKnowledges] = useState([])
  const [loading, setLoading] = useState(true)

  const loadKnowledges = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const data = await knowledgeService.getKnowledges(session.user.id)
      setKnowledges(data || [])
    } catch (err) {
      console.error('Failed to load knowledges:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    loadKnowledges()
  }, [loadKnowledges])

  const handleCreateKnowledge = async (data) => {
    if (!session?.user?.id) return
    const newKnowledge = await knowledgeService.createKnowledge(session.user.id, data)
    setKnowledges(prev => [newKnowledge, ...prev])
    return newKnowledge
  }

  const handleUpdateKnowledge = async (id, updates) => {
    const updated = await knowledgeService.updateKnowledge(id, updates)
    setKnowledges(prev => prev.map(k => (k.id === id ? updated : k)))
    return updated
  }

  const handleDeleteKnowledge = async (id) => {
    await knowledgeService.deleteKnowledge(id)
    setKnowledges(prev => prev.filter(k => k.id !== id))
  }

  return {
    knowledges,
    loading,
    handleCreateKnowledge,
    handleUpdateKnowledge,
    handleDeleteKnowledge,
    refreshKnowledges: loadKnowledges
  }
}

export function useKnowledgeSources(knowledgeId) {
  const { session } = useAuthSession()
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [updatingSourceId, setUpdatingSourceId] = useState(null)

  const loadSources = useCallback(async () => {
    if (!knowledgeId) {
      setSources([])
      return
    }
    setLoading(true)
    try {
      const data = await knowledgeService.getKnowledgeSources(knowledgeId)
      setSources(data || [])
    } catch (err) {
      console.error('Failed to load knowledge sources:', err)
    } finally {
      setLoading(false)
    }
  }, [knowledgeId])

  useEffect(() => {
    loadSources()
  }, [loadSources])

  useEffect(() => {
    if (!knowledgeId) return

    const hasProcessingSource = sources.some(source => (
      source.processing_status === 'PENDING' || source.processing_status === 'ING'
    ))

    if (!hasProcessingSource) return

    const intervalId = window.setInterval(() => {
      loadSources()
    }, 3000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [knowledgeId, loadSources, sources])

  const handleUploadSource = async (file) => {
    if (!knowledgeId) throw new Error('지식 항목을 먼저 선택해주세요.')
    if (!session?.access_token) throw new Error('인증 정보가 없습니다.')
    if (!file) throw new Error('업로드할 파일이 없습니다.')

    setIsUploading(true)
    try {
      await knowledgeService.uploadKnowledgeSource(knowledgeId, file, session.access_token)
      await loadSources()
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteSource = async (id) => {
    if (!knowledgeId) throw new Error('지식 항목을 먼저 선택해주세요.')
    if (!session?.access_token) throw new Error('인증 정보가 없습니다.')

    setIsDeleting(true)
    try {
      await knowledgeService.deleteKnowledgeSource(knowledgeId, id, session.access_token)
      setSources(prev => prev.filter(s => s.id !== id))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateSource = async (id, updates) => {
    if (!knowledgeId) throw new Error('지식 항목을 먼저 선택해주세요.')

    setUpdatingSourceId(id)
    try {
      const updated = await knowledgeService.updateKnowledgeSource(id, updates)
      setSources(prev => prev.map(source => (source.id === id ? updated : source)))
      return updated
    } finally {
      setUpdatingSourceId(null)
    }
  }

  const handleDownloadSource = async (source) => {
    if (!knowledgeId) throw new Error('지식 항목을 먼저 선택해주세요.')
    
    const { id, display_name: displayName } = source
    
    // display_name이 http로 시작하는 외부 링크인 경우 직접 열기
    if (displayName && (displayName.startsWith('http://') || displayName.startsWith('https://'))) {
      window.open(displayName, '_blank', 'noopener,noreferrer')
      return
    }

    if (!session?.access_token) throw new Error('인증 정보가 없습니다.')

    setIsDownloading(true)
    try {
      const { blob, filename } = await knowledgeService.downloadKnowledgeSource(knowledgeId, id, session.access_token)
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || displayName || 'download'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } finally {
      setIsDownloading(false)
    }
  }

  return {
    sources,
    loading,
    isUploading,
    isDeleting,
    isDownloading,
    updatingSourceId,
    handleUploadSource,
    handleDeleteSource,
    handleDownloadSource,
    handleUpdateSource,
    refreshSources: loadSources
  }
}
