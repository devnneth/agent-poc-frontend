import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

/**
 * 메모 편집 및 신규 작성을 위한 모달 편집기 컴포넌트
 * @param {Object} props
 * @param {Object} props.memo 편집할 메모 객체 (신규 작성 시 null)
 * @param {Function} props.onSave 저장 시 호출될 함수 (신규)
 * @param {Function} props.onUpdate 수정 시 호출될 함수 (기존)
 * @param {Function} props.onDelete 삭제 시 호출될 함수
 * @param {Function} props.onClose 닫기 시 호출될 함수
 */
export function MemoEditor({ memo, onSave, onUpdate, onDelete, onClose }) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(memo?.title || '')
  const [content, setContent] = useState(memo?.content || '')
  const isEditing = !!memo

  const handleSaveOrUpdate = () => {
    if (isEditing) {
      onUpdate(memo.id, { title, content })
    } else {
      onSave({ title, content })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#1c1c1c] dark:bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800">
          <h3 className="text-xl font-bold text-white dark:text-stone-100">
            {isEditing ? t('memo.edit_title') : t('memo.create_title')}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors" aria-label={t('common.close')}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label htmlFor="memo-title" className="block text-sm font-medium text-stone-400">{t('memo.label_title')}</label>
            <input
              id="memo-title"
              className="w-full bg-[#161616] dark:bg-stone-950 border border-stone-800 rounded-lg px-4 py-2.5 text-white dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-stone-600 text-lg font-semibold"
              type="text"
              placeholder={t('memo.placeholder_title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2 flex-1">
            <label htmlFor="memo-content" className="block text-sm font-medium text-stone-400">{t('memo.label_content')}</label>
            <textarea
              id="memo-content"
              className="w-full bg-[#161616] dark:bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 text-white dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-stone-600 text-base leading-relaxed resize-none min-h-[250px]"
              placeholder={t('memo.placeholder_content')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-5 border-t border-stone-800 flex justify-end gap-3 bg-[#1c1c1c] dark:bg-stone-900 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white font-medium transition-all text-sm"
          >
            {t('common.cancel')}
          </button>

          {isEditing && (
            <button
              onClick={() => {
                if (confirm(t('memo.delete_confirm'))) {
                  onDelete(memo.id)
                }
              }}
              className="px-5 py-2.5 rounded-lg border border-red-900/50 text-red-500 hover:bg-red-900/20 hover:text-red-400 font-medium transition-all text-sm"
            >
              {t('common.delete')}
            </button>
          )}

          <button
            onClick={handleSaveOrUpdate}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-900/20 transition-all text-sm"
          >
            {isEditing ? t('common.save') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
