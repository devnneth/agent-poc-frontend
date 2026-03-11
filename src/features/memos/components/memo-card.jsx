import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 개별 메모를 표시하는 카드 컴포넌트
 * @param {Object} props - memo 객체
 */
export function MemoCard({ memo, onClick }) {
  const { t } = useTranslation()
  const formattedDate = new Date(memo.updatedAt).toLocaleDateString(t('common.language') === '영어' ? 'en-US' : 'ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-stone-900 p-6 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-all cursor-pointer border border-stone-200 dark:border-stone-800 group shadow-sm"
    >
      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-3 group-hover:text-blue-500 transition-colors">
        {memo.title}
      </h3>
      <div className="text-stone-600 dark:text-stone-400 text-sm mb-6 line-clamp-3 whitespace-pre-wrap">
        {memo.content}
      </div>
      <div className="text-xs text-stone-400 dark:text-stone-500 font-medium">
        {formattedDate} {t('memo.edited_at')}
      </div>
    </div>
  )
}
