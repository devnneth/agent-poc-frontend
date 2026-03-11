import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/ui/page-header'
import { TodoList } from '../components/todo-list'
import { TodoEditSidebar } from '../components/todo-edit-sidebar'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { useTodos } from '../hooks/use-todos'

export function TodoScreen() {
  const { t } = useTranslation()

  const PRIORITY_MAP = {
    urgent: { label: t('todo.priority_urgent'), color: 'bg-red-500' },
    high: { label: t('todo.priority_high'), color: 'bg-orange-500' },
    normal: { label: t('todo.priority_normal'), color: 'bg-stone-400' }
  }
  const { 
    todos, 
    loading, 
    error,
    handleToggleTodo, 
    handleAddTodo, 
    handleReorderTodos, 
    setTodos,
    editingTodo, 
    handleEdit, 
    handleCloseSidebar, 
    handleSave, 
    handleDelete,
    isActionLoading 
  } = useTodos()
  
  const [inputValue, setInputValue] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('normal')
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPriorityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async () => {
    if (!inputValue.trim()) return
    await handleAddTodo({
      title: inputValue.trim(),
      priority: selectedPriority
    })
    setInputValue('')
    setSelectedPriority('normal')
  }

  return (
    <section className="flex h-full flex-col">
      <PageHeader
        category={t('sidebar.todo')}
        title={t('todo.title')}
        description={t('todo.desc')}
        className="border-b pb-6"
      />

      <div className="mt-6 pb-12 flex-1">
        
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="mb-8 relative group z-40">
            <div className={`absolute inset-0 bg-blue-600/10 dark:bg-blue-600/20 rounded-xl blur transition duration-300 ${isActionLoading ? 'opacity-10' : 'opacity-25 group-hover:opacity-40'}`}></div>
            <div className={`relative flex items-center bg-white dark:bg-stone-900 rounded-xl border shadow-md p-2 transition-colors ${isActionLoading ? 'border-stone-100 dark:border-stone-800 opacity-60' : 'border-stone-200 dark:border-stone-800'}`}>
              <div className="relative mr-3 z-50" ref={dropdownRef}>
                <button 
                  onClick={() => !isActionLoading && setShowPriorityDropdown(!showPriorityDropdown)}
                  disabled={isActionLoading}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg text-sm font-medium transition-colors focus:outline-none min-w-[100px] disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_MAP[selectedPriority].color}`}></span>
                    {PRIORITY_MAP[selectedPriority].label}
                  </span>
                  <ChevronDown className="h-4 w-4 text-stone-400" />
                </button>
                {showPriorityDropdown && (
                  <div className="absolute top-full mt-2 left-0 w-32 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg overflow-hidden py-1 z-50">
                    {Object.entries(PRIORITY_MAP).map(([key, { label, color }]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedPriority(key)
                          setShowPriorityDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2 ${selectedPriority === key ? 'bg-stone-50 dark:bg-stone-800 font-medium' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${color}`}></span>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input 
                className="flex-1 bg-transparent border-none focus:ring-0 text-base py-2 px-1 outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400 disabled:opacity-50" 
                placeholder={t('todo.input_placeholder')} 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit()
                }}
                disabled={isActionLoading}
              />
              <div className="flex items-center border-l border-stone-200 dark:border-stone-700 pl-2 ml-2">
                <button 
                  onClick={handleSubmit}
                  disabled={isActionLoading || !inputValue.trim()}
                  className="px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('todo.add')}
                </button>
              </div>
            </div>
          </div>

        {loading ? (
          <div className="flex justify-center p-10 text-stone-500 font-medium">{t('todo.loading')}</div>
        ) : todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-900/50">
            <p className="text-sm font-medium">{t('todo.empty_text')}</p>
            <p className="text-xs text-stone-500 mt-1">{t('todo.empty_subtext')}</p>
          </div>
        ) : (
          <TodoList 
            todos={todos} 
            setTodos={setTodos}
            onToggle={handleToggleTodo} 
            onEdit={handleEdit} 
            onReorder={handleReorderTodos}
          />
        )}
      </div>

      {editingTodo && (
        <TodoEditSidebar 
          key={editingTodo.id}
          open={!!editingTodo} 
          todo={editingTodo} 
          onClose={handleCloseSidebar} 
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </section>
  )
}
