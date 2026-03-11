import React from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus } from 'lucide-react'

/**
 * 메모 검색 및 새 메모 추가를 위한 바 컴포넌트
 */
export function MemoSearchBar({ value, onChange, onAdd }) {
  const { t } = useTranslation()
  
  return (
    <div className="relative group mb-8 z-40">
      {/* 배경 장식 (블러 효과) */}
      <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-600/20 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
      
      {/* 실제 컨테이너 */}
      <div className="relative flex items-center bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-md p-2">
        {/* 검색 아이콘 영역 */}
        <div className="flex items-center justify-center w-10 h-10 text-stone-400 pl-1">
          <Search className="h-5 w-5" />
        </div>
        
        {/* 입력창 */}
        <input
          type="text"
          className="flex-1 bg-transparent border-none focus:ring-0 text-base py-2 px-3 outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
          placeholder={t('memo.search_placeholder')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        
        {/* 추가 버튼 영역 */}
        <div className="flex items-center border-l border-stone-200 dark:border-stone-700 pl-2 ml-2">
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            {t('memo.new_memo')}
          </button>
        </div>
      </div>
    </div>
  )
}
