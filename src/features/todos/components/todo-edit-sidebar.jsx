import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronDown } from 'lucide-react'

export function TodoEditSidebar({
  open,
  todo,
  onClose,
  onSave,
  onDelete
}) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(todo?.title || '')
  const [priority, setPriority] = useState(todo?.priority || 'normal')
  const [description, setDescription] = useState(todo?.description || '')

  if (!open || !todo) return null

  const handleSaveClick = () => {
    onSave({ ...todo, title, priority, description })
  }

  const handleDeleteClick = () => {
    if (window.confirm(t('todo.delete_confirm'))) {
      onDelete(todo.id)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#1c1c1c] dark:bg-stone-900 border border-stone-800 w-full max-w-lg rounded-2xl shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-800">
          <h3 className="text-xl font-bold text-white dark:text-stone-100">{t('todo.edit_title')}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors" aria-label={t('common.close')}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="todo-title" className="block text-sm font-medium text-stone-400">{t('todo.label_content')}</label>
            <input 
              id="todo-title"
              className="w-full bg-[#161616] dark:bg-stone-950 border border-stone-800 rounded-lg px-4 py-2.5 text-white dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-stone-600" 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('todo.placeholder_content')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="todo-description" className="block text-sm font-medium text-stone-400">{t('todo.label_description')}</label>
            <textarea 
              id="todo-description"
              className="w-full bg-[#161616] dark:bg-stone-950 border border-stone-800 rounded-lg px-4 py-2.5 text-white dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-stone-600 resize-none h-24" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('todo.placeholder_description')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="todo-priority" className="block text-sm font-medium text-stone-400">{t('todo.label_priority')}</label>
            <div className="relative">
              <select 
                id="todo-priority"
                className="w-full bg-[#161616] dark:bg-stone-950 border border-stone-800 rounded-lg px-4 py-2.5 text-white dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="urgent">{t('todo.priority_urgent')}</option>
                <option value="high">{t('todo.priority_high')}</option>
                <option value="normal">{t('todo.priority_normal')}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-stone-400" />
              </div>
            </div>
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
          <button 
            onClick={handleDeleteClick}
            className="px-5 py-2.5 rounded-lg border border-red-900/50 text-red-500 hover:bg-red-900/20 hover:text-red-400 font-medium transition-all text-sm"
          >
            {t('common.delete')}
          </button>
          <button 
            onClick={handleSaveClick}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-900/20 transition-all text-sm"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
