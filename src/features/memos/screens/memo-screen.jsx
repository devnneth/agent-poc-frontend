import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/ui/page-header'
import { useMemos } from '../hooks/use-memos'
import { MemoCard } from '../components/memo-card'
import { MemoSearchBar } from '../components/memo-search-bar'
import { MemoEditor } from '../components/memo-editor'

/**
 * 메모 기능의 메인 화면 컴포넌트
 */
export function MemoScreen() {
  const { t } = useTranslation()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState(null)
  
  const { 
    memos, 
    loading, 
    searchQuery, 
    handleCreateMemo, 
    handleUpdateMemo, 
    handleDeleteMemo, 
    handleSearch 
  } = useMemos()

  const openEditor = (memo = null) => {
    setSelectedMemo(memo)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setIsEditorOpen(false)
    setSelectedMemo(null)
  }

  const onSave = async (data) => {
    await handleCreateMemo(data)
    closeEditor()
  }

  const onUpdate = async (id, data) => {
    await handleUpdateMemo(id, data)
    closeEditor()
  }

  const onDelete = async (id) => {
    await handleDeleteMemo(id)
    closeEditor()
  }

  return (
    <section className="flex h-full flex-col">
      <PageHeader
        category={t('sidebar.memo')}
        title={t('memo.title')}
        description={t('memo.desc')}
        className="border-b pb-6"
      />

      <div className="mt-6 pb-12 flex-1">
        <MemoSearchBar
          value={searchQuery}
          onChange={handleSearch}
          onAdd={() => openEditor()}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-100"></div>
          </div>
        ) : memos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onClick={() => openEditor(memo)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-stone-500 dark:text-stone-400">
            <span className="material-icons-outlined text-4xl mb-4 block">description</span>
            <p>{t('memo.empty_text')}</p>
          </div>
        )}
      </div>

      {isEditorOpen && (
        <MemoEditor
          key={selectedMemo?.id || 'new'}
          memo={selectedMemo}
          onSave={onSave}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onClose={closeEditor}
        />
      )}
    </section>
  )
}
