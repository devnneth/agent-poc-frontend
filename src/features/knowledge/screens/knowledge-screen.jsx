import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronRight, BookOpen, X, ArrowLeft, Upload, Edit, Trash2, FileText, Calendar, HardDrive, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { isProductionEnvironment } from '@/lib/env'
import { useKnowledges, useKnowledgeSources } from '../hooks/use-knowledges'

export function KnowledgeScreen() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const isKnowledgeMutationUnsupported = isProductionEnvironment()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const fileInputRef = useRef(null)
  
  // 현재 선택된 지식 항목 (상세 데이터 목록 뷰를 위해)
  const [selectedKnowledge, setSelectedKnowledge] = useState(null)
  
  // 폼 정보 수정/등록용 로컬 상태
  const [editForm, setEditForm] = useState({ title: '', description: '', is_rag_enabled: true })

  // Supabase DB 연동 커스텀 훅
  const { knowledges, handleCreateKnowledge, handleUpdateKnowledge, loading: knowledgesLoading } = useKnowledges()
  const {
    sources,
    handleUploadSource,
    handleDeleteSource,
    handleDownloadSource,
    handleUpdateSource,
    loading: sourcesLoading,
    isUploading,
    isDeleting,
    isDownloading,
    updatingSourceId,
  } = useKnowledgeSources(selectedKnowledge?.id)

  const formatFileSize = (fileSize) => {
    if (!fileSize) return t('knowledge.file_size_empty', 'N/A')
    if (fileSize < 1024) return `${fileSize} B`
    if (fileSize < 1024 * 1024) return `${Math.round(fileSize / 1024)} KB`
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
  }

  const getProcessingStatusMeta = (status) => {
    switch (status) {
      case 'DONE':
        return {
          label: t('knowledge.processing_status_done', '완료'),
          className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
        }
      case 'ERROR':
        return {
          label: t('knowledge.processing_status_error', '오류'),
          className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
        }
      case 'ING':
        return {
          label: t('knowledge.processing_status_ing', '처리 중'),
          className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        }
      case 'PENDING':
      default:
        return {
          label: t('knowledge.processing_status_pending', '대기 중'),
          className: 'border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300',
        }
    }
  }

  const getRagEnabledLabel = (isEnabled) => (
    isEnabled
      ? t('knowledge.rag_enabled_on', 'ON')
      : t('knowledge.rag_enabled_off', 'OFF')
  )

  const getCollectionStatusLabel = (isEnabled) => (
    isEnabled
      ? t('knowledge.collection_status_active', '활성')
      : t('knowledge.collection_status_inactive', '비활성')
  )

  const showKnowledgeMutationUnsupportedToast = () => {
    toast({
      title: t('knowledge.toast_source_action_unsupported_title', '지원되지 않는 기능'),
      description: t('knowledge.toast_source_action_unsupported_desc', '배포 환경에서는 지식 등록, 정보 수정, 업로드, 삭제, RAG on/off 변경을 지원하지 않습니다. 관리자에게 문의해주세요.'),
    })
  }

  const handleUploadButtonClick = () => {
    if (isKnowledgeMutationUnsupported) {
      showKnowledgeMutationUnsupportedToast()
      return
    }

    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (isKnowledgeMutationUnsupported) {
      showKnowledgeMutationUnsupportedToast()
      event.target.value = ''
      return
    }

    try {
      await handleUploadSource(file)
      toast({
        title: t('knowledge.toast_upload_success_title', '업로드 완료'),
        description: t('knowledge.toast_upload_success_desc', '파일이 업로드되었습니다.'),
      })
    } catch (err) {
      console.error('Failed to upload knowledge source:', err)
      toast({
        variant: 'destructive',
        title: t('common.error', '오류'),
        description: err.message || t('knowledge.toast_upload_error_desc', '파일 업로드 중 오류가 발생했습니다.'),
      })
    } finally {
      event.target.value = ''
    }
  }

  const handleSourceDelete = async (sourceId) => {
    if (isKnowledgeMutationUnsupported) {
      showKnowledgeMutationUnsupportedToast()
      return
    }

    try {
      await handleDeleteSource(sourceId)
      toast({
        title: t('knowledge.toast_delete_source_success_title', '삭제 완료'),
        description: t('knowledge.toast_delete_source_success_desc', '파일이 삭제되었습니다.'),
      })
    } catch (err) {
      console.error('Failed to delete knowledge source:', err)
      toast({
        variant: 'destructive',
        title: t('common.error', '오류'),
        description: err.message || t('knowledge.toast_delete_source_error_desc', '파일 삭제 중 오류가 발생했습니다.'),
      })
    }
  }

  const handleSourceDownload = async (source) => {
    try {
      await handleDownloadSource(source)
    } catch (err) {
      console.error('Failed to download knowledge source:', err)
      toast({
        variant: 'destructive',
        title: t('common.error', '오류'),
        description: err.message || t('knowledge.toast_download_error_desc', '파일 다운로드 중 오류가 발생했습니다.'),
      })
    }
  }

  // 등록 모달 열기
  const handleOpenAddModal = () => {
    if (isKnowledgeMutationUnsupported) {
      showKnowledgeMutationUnsupportedToast()
      return
    }

    setEditForm({ title: '', description: '', is_rag_enabled: true })
    setIsModalOpen(true)
  }

  // 수정 모달 열기
  const handleOpenEditModal = () => {
    if (isKnowledgeMutationUnsupported) {
      showKnowledgeMutationUnsupportedToast()
      return
    }

    if (selectedKnowledge) {
      setEditForm({
        title: selectedKnowledge.title,
        description: selectedKnowledge.description,
        is_rag_enabled: selectedKnowledge.is_rag_enabled ?? true,
      })
      setIsEditModalOpen(true)
    }
  }

  const handleSaveKnowledge = async () => {
    try {
      const updatedKnowledge = await handleUpdateKnowledge(selectedKnowledge.id, editForm)
      setSelectedKnowledge(updatedKnowledge ?? { ...selectedKnowledge, ...editForm })
      setIsEditModalOpen(false)
    } catch (err) {
      console.error('Failed to update knowledge:', err)
      toast({
        variant: 'destructive',
        title: t('common.error', '오류'),
        description: err.message || t('knowledge.toast_update_knowledge_error_desc', '지식 정보 수정 중 오류가 발생했습니다.'),
      })
    }
  }

  const handleSourceRagEnabledChange = async (sourceId, nextChecked) => {
    if (isKnowledgeMutationUnsupported) {
      showKnowledgeMutationUnsupportedToast()
      return
    }

    try {
      await handleUpdateSource(sourceId, { is_rag_enabled: nextChecked })
    } catch (err) {
      console.error('Failed to update knowledge source rag state:', err)
      toast({
        variant: 'destructive',
        title: t('common.error', '오류'),
        description: err.message || t('knowledge.toast_toggle_source_error_desc', '지식 데이터 on/off 변경 중 오류가 발생했습니다.'),
      })
    }
  }

  const handleSourceRetry = async (sourceId) => {
    if (isKnowledgeMutationUnsupported) {
      showKnowledgeMutationUnsupportedToast()
      return
    }

    if (!window.confirm(t('knowledge.retry_source_confirm', '재시도하시겠습니까?'))) {
      return
    }

    try {
      await handleUpdateSource(sourceId, {
        processing_status: 'PENDING',
        processing_error_message: null,
      })
    } catch (err) {
      console.error('Failed to retry knowledge source:', err)
      toast({
        variant: 'destructive',
        title: t('common.error', '오류'),
        description: err.message || t('knowledge.toast_retry_source_error_desc', '지식 데이터 재시도 중 오류가 발생했습니다.'),
      })
    }
  }

  // 상세 뷰 렌더링
  if (selectedKnowledge) {
    return (
      <section className="flex h-full flex-col fade-in animate-in duration-300">
        {/* 상단 뒤로가기 액션 */}
        <div className="mb-2">
          <button
            onClick={() => setSelectedKnowledge(null)}
            className="group flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t('knowledge.back_to_list', '목록으로 돌아가기')}
          </button>
        </div>

        <PageHeader
          category={`${t('sidebar.knowledge', '지식 관리')} > ${selectedKnowledge.title}`}
          title={t('knowledge.data_list_title', '지식 데이터')}
          description={selectedKnowledge.description}
          className="border-b pb-6"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleOpenEditModal}
              className="flex items-center gap-2 border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              <Edit className="h-4 w-4" />
              {t('knowledge.edit_button', '정보수정')}
            </Button>
            <Button
              onClick={handleUploadButtonClick}
              disabled={isUploading}
              className="flex items-center gap-2 bg-indigo-600 font-medium text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg"
            >
              <Upload className="h-4 w-4" />
              {isUploading
                ? t('knowledge.uploading_button', '업로드 중...')
                : t('knowledge.upload_button', '업로드')}
            </Button>
          </div>
        </PageHeader>

        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <span>{t('knowledge.collection_status_label', '컬렉션 상태')}</span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
              (selectedKnowledge.is_rag_enabled ?? true)
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
            }`}
          >
            {getCollectionStatusLabel(selectedKnowledge.is_rag_enabled ?? true)}
          </span>
        </div>

        <div className="mt-6 pb-12 flex-1 flex flex-col overflow-hidden">
          {sourcesLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-sm text-stone-500">{t('common.loading', '로딩 중...')}</span>
            </div>
          ) : sources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center dark:border-stone-800 dark:bg-stone-900/70">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                {t('knowledge.file_empty', '업로드된 지식 데이터가 없습니다.')}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {t('knowledge.file_empty_subtext', '우측 상단의 업로드 버튼을 눌러 파일을 추가하세요.')}
              </p>
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-950/50">
              <TooltipProvider delayDuration={150}>
                <table className="w-full table-auto text-left text-sm">
                <colgroup>
                  <col className="w-full" />
                  <col />
                  <col />
                  <col />
                  <col />
                  <col />
                </colgroup>
                <thead className="sticky top-0 border-b border-stone-200 bg-stone-50/90 text-stone-500 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/90 dark:text-stone-400">
                  <tr>
                    <th className="w-full px-5 py-3.5 text-left font-semibold text-stone-700 dark:text-stone-300">
                      {t('knowledge.file_name', '파일제목')}
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-left font-semibold">
                      {t('knowledge.upload_date', '업로드날짜')}
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-left font-semibold">
                      {t('knowledge.file_size', '크기')}
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-left font-semibold">
                      {t('knowledge.processing_status', '상태')}
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-left font-semibold">
                      {t('knowledge.rag_toggle_column', 'RAG 사용')}
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-center font-semibold">
                      {t('common.delete', '삭제')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {sources.map((s) => {
                    const statusMeta = getProcessingStatusMeta(s.processing_status)
                    const isDone = s.processing_status === 'DONE'
                    const canRetry = s.processing_status === 'ERROR'
                    const isActionLocked = !isDone
                    const isSourceUpdating = updatingSourceId === s.id
                    const canDelete = isDone
                    const deleteTooltip = canDelete
                      ? t('common.delete', '삭제')
                      : t('knowledge.delete_disabled_tooltip', '완료 전에는 삭제할 수 없습니다.')
                    const ragToggleDisabled = isActionLocked || isSourceUpdating
                    const ragTooltip = ragToggleDisabled
                      ? t('knowledge.rag_disabled_tooltip', '완료 전에는 RAG 옵션을 변경할 수 없습니다.')
                      : null

                    return (
                      <tr key={s.id} className="group transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/60">
                        <td className="w-full px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate font-medium text-stone-900 dark:text-stone-200">
                                {s.display_name && (s.display_name.startsWith('http://') || s.display_name.startsWith('https://'))
                                  ? s.display_name.split('/').filter(Boolean).pop()
                                  : s.display_name}
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => handleSourceDownload(s)}
                                    disabled={isDownloading}
                                    aria-label={t('knowledge.download_file', '파일 다운로드')}
                                    className="inline-flex items-center justify-center rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('knowledge.download_file', '파일 다운로드')}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(s.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                            <HardDrive className="h-3.5 w-3.5" />
                            {formatFileSize(s.file_size)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2">
                            {canRetry ? (
                              <button
                                type="button"
                                onClick={() => handleSourceRetry(s.id)}
                                disabled={isSourceUpdating}
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-red-900 ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </button>
                            ) : (
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                {statusMeta.label}
                              </span>
                            )}
                            {s.processing_status === 'ERROR' && s.processing_error_message ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-full p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none dark:text-red-400 dark:hover:bg-red-950/40"
                                    aria-label={t('knowledge.processing_error_tooltip_label', '오류 사유 보기')}
                                  >
                                    <AlertCircle className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs whitespace-pre-wrap break-words">
                                  {s.processing_error_message}
                                </TooltipContent>
                              </Tooltip>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-3">
                            {ragToggleDisabled ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0} className="inline-flex">
                                    <Switch
                                      checked={s.is_rag_enabled ?? true}
                                      disabled={true}
                                      aria-label={t('knowledge.source_rag_switch_aria', {
                                        defaultValue: `${s.display_name} RAG 사용 토글`,
                                        name: s.display_name,
                                      })}
                                      className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-stone-300 dark:data-[state=unchecked]:bg-stone-700"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {ragTooltip}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Switch
                                checked={s.is_rag_enabled ?? true}
                                disabled={false}
                                aria-label={t('knowledge.source_rag_switch_aria', {
                                  defaultValue: `${s.display_name} RAG 사용 토글`,
                                  name: s.display_name,
                                })}
                                onCheckedChange={(checked) => handleSourceRagEnabledChange(s.id, checked)}
                                className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-stone-300 dark:data-[state=unchecked]:bg-stone-700"
                              />
                            )}
                            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                              {getRagEnabledLabel(s.is_rag_enabled ?? true)}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0} className="inline-flex">
                                <button
                                  title={deleteTooltip}
                                  type="button"
                                  onClick={() => {
                                    if (!canDelete || isDeleting) return
                                    if (isKnowledgeMutationUnsupported) {
                                      handleSourceDelete(s.id)
                                      return
                                    }
                                    if (window.confirm(t('common.confirm_delete', '정말 삭제하시겠습니까?'))) {
                                      handleSourceDelete(s.id)
                                    }
                                  }}
                                  disabled={!canDelete || isDeleting}
                                  className="inline-flex items-center justify-center rounded-md p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 dark:text-stone-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </span>
                            </TooltipTrigger>
                            {!canDelete ? (
                              <TooltipContent>
                                {deleteTooltip}
                              </TooltipContent>
                            ) : null}
                          </Tooltip>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                </table>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* 정보수정 모달 */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-stone-900 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-stone-800">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {t('knowledge.edit_modal_title', '지식 정보 수정')}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-5 p-6 md:px-8 space-y-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    {t('knowledge.title_label', '제목')}
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder={t('knowledge.title_placeholder', '지식의 제목을 입력하세요')}
                    className="w-full rounded-xl border border-stone-200 bg-transparent px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:text-stone-100"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                    {t('knowledge.desc_label', '설명')}
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder={t('knowledge.desc_placeholder', '지식에 대한 상세 설명을 입력하세요')}
                    className="w-full resize-none rounded-xl border border-stone-200 bg-transparent px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:text-stone-100"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                      {t('knowledge.rag_enabled_label', 'RAG 사용')}
                    </p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {t('knowledge.rag_enabled_description', '컬렉션을 끄면 이 컬렉션의 지식은 RAG 검색에서 제외됩니다.')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {getRagEnabledLabel(editForm.is_rag_enabled ?? true)}
                    </span>
                    <Switch
                      checked={editForm.is_rag_enabled ?? true}
                      aria-label={t('knowledge.collection_rag_switch_aria', '컬렉션 RAG 사용 토글')}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, is_rag_enabled: checked })}
                      className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-stone-300 dark:data-[state=unchecked]:bg-stone-700"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 rounded-b-2xl bg-stone-50 px-6 py-4 md:px-8 dark:bg-stone-950/50">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  {t('common.cancel', '취소')}
                </Button>
                <Button
                  onClick={handleSaveKnowledge}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {t('common.confirm', '확인')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  // 목록 뷰 렌더링
  return (
    <section className="flex h-full flex-col">
      <PageHeader
        category={t('sidebar.knowledge', '지식 관리')}
        title={t('knowledge.title', '지식 관리')}
        description={t('knowledge.desc', 'AI에게 지식을 제공하여 지능을 강화하세요.')}
        className="border-b pb-6"
      >
        <Button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-indigo-600 font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {t('knowledge.add_button', '등록')}
        </Button>
      </PageHeader>

      <div className="mt-6 pb-12 flex-1 flex flex-col">
        {knowledgesLoading ? (
          <div className="flex flex-1 items-center justify-center">
             <span className="text-sm text-stone-500">{t('common.loading', '로딩 중...')}</span>
          </div>
        ) : knowledges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center dark:border-stone-800 dark:bg-stone-900/70">
            <p className="text-sm text-stone-400 dark:text-stone-500">
              {t('knowledge.empty_text', '등록된 지식이 없습니다.')}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {t('knowledge.list_empty_subtext', '우측 상단의 등록 버튼을 눌러 추가하세요.')}
            </p>
          </div>
        ) : (
          <ul className="space-y-3 pb-6">
            {knowledges.map((item) => {
              const isRagEnabled = item.is_rag_enabled ?? true

              return (
                <li key={item.id}>
                  <div
                    className="group flex w-full cursor-pointer items-start justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-left transition hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-600"
                    onClick={() => setSelectedKnowledge(item)}
                  >
                    <div className="flex flex-1 items-start gap-4 pr-6">
                      <div className="mt-0.5 rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold tracking-tight text-stone-900 transition-colors group-hover:text-indigo-600 dark:text-stone-100 dark:group-hover:text-indigo-400">
                            {item.title}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                              isRagEnabled
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
                            }`}
                          >
                            {getCollectionStatusLabel(isRagEnabled)}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 self-center text-stone-300 transition-colors group-hover:text-stone-500 dark:text-stone-600 dark:group-hover:text-stone-400" />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 등록 팝업(모달) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-stone-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-stone-800">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {t('knowledge.add_modal_title', '지식 추가')}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-5 p-6 md:px-8 space-y-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {t('knowledge.title_label', '제목')}
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder={t('knowledge.title_placeholder', '지식의 제목을 입력하세요')}
                  className="w-full rounded-xl border border-stone-200 bg-transparent px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:text-stone-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {t('knowledge.desc_label', '설명')}
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder={t('knowledge.desc_placeholder', '지식에 대한 상세 설명을 입력하세요')}
                  className="w-full resize-none rounded-xl border border-stone-200 bg-transparent px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-stone-700 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-2xl bg-stone-50 px-6 py-4 md:px-8 dark:bg-stone-950/50">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {t('common.cancel', '취소')}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await handleCreateKnowledge(editForm)
                    setIsModalOpen(false)
                  } catch (err) {
                    console.error('Failed to create knowledge:', err)
                    alert(t('error.create_failed', '등록에 실패했습니다.'))
                  }
                }}
                className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {t('common.confirm', '확인')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
