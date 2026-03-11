import { useTranslation } from 'react-i18next'
import { Checkbox } from '../../../components/ui/checkbox'
import { Calendar, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function TodoItemCard({
  todo,
  onToggle,
  onEdit,
  isDragging,
  setNodeRef,
  attributes,
  listeners,
  style
}) {
  const { t } = useTranslation()
  const isDone = todo.status === 'DONE'

  const formatTime = (isoString) => {
    const d = new Date(isoString)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) {
      return `${t('todo.today')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }
    return d.toLocaleDateString()
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 w-full p-4 rounded-xl border border-stone-200 dark:border-stone-800 transition-all ${!isDragging ? 'hover:border-blue-500 hover:shadow-sm' : ''} ${isDone ? 'opacity-50 grayscale hover:opacity-80' : 'bg-white dark:bg-stone-900 shadow-sm'} ${isDragging ? 'opacity-90 shadow-2xl ring-2 ring-blue-500 bg-white dark:bg-stone-900 scale-[1.02] cursor-grabbing z-50' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className={`flex-shrink-0 flex items-center justify-center text-stone-300 hover:text-stone-500 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-shrink-0 flex items-center justify-center">
        <Checkbox 
          checked={isDone} 
          onCheckedChange={() => onToggle && onToggle(todo.id, todo.status)}
          className="w-5 h-5 rounded-md border-2"
        />
      </div>
      <div 
        className="flex-1 cursor-pointer min-w-0"
        onClick={() => onEdit && onEdit(todo)}
      >
        <h4 className={`text-[16px] font-medium transition-colors truncate ${isDone ? 'line-through text-stone-500 group-hover:no-underline' : 'text-stone-900 dark:text-stone-100 group-hover:text-blue-500'}`}>
          {todo.title}
        </h4>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0" onClick={() => onEdit && onEdit(todo)}>
        <span className={`w-[72px] text-center shrink-0 px-2 py-1 text-[12px] font-semibold rounded-md border ${isDone ? 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400' : 
          todo.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
          todo.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' :
          'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'}`}>
          {isDone ? t('todo.status_completed') : (todo.priority === 'urgent' ? t('todo.priority_urgent') : todo.priority === 'high' ? t('todo.priority_high') : t('todo.priority_normal'))}
        </span>
        <div className="w-[100px] text-[13px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-medium shrink-0">
          <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
          <span className="truncate">{formatTime(todo.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

export function TodoItem({
  todo,
  onToggle,
  onEdit
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: todo.id,
    data: {
      type: 'Todo',
      todo
    }
  })

  // We change original item's opacity when dragging to make it look like it's lifted,
  // but it stays in DOM. The DragOverlay handles the floating copy.
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <TodoItemCard 
      todo={todo}
      onToggle={onToggle}
      onEdit={onEdit}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      style={style}
    />
  )
}
