import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { TodoItem, TodoItemCard } from './todo-item'

function DroppableList({ id, items, children }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className="flex flex-col gap-[8px] min-h-[50px]">
        {children}
      </div>
    </SortableContext>
  )
}

export function TodoList({ todos, setTodos, onToggle, onEdit, onReorder }) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState(null)
  const [originalTodoStatus, setOriginalTodoStatus] = useState(null)

  const todoItems = useMemo(() => todos.filter(t => t.status !== 'DONE'), [todos])
  const doneItems = useMemo(() => todos.filter(t => t.status === 'DONE'), [todos])
  const activeTodo = useMemo(() => todos.find(t => t.id === activeId), [todos, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
    const todo = todos.find(t => t.id === event.active.id)
    if (todo) setOriginalTodoStatus(todo.status)
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeTodoItem = todos.find(t => t.id === active.id)
    const overItem = todos.find(t => t.id === over.id)
    
    // Determine the container we dropped into
    let targetStatus = over.id === 'TODO' || over.id === 'DONE' 
      ? over.id 
      : overItem?.status

    if (!activeTodoItem || !targetStatus || activeTodoItem.status === targetStatus) return

    // Immediately update status to allow cross-container dragging without disappearing
    setTodos((prev) => {
      const activeIndex = prev.findIndex(t => t.id === active.id)
      const overIndex = overItem ? prev.findIndex(t => t.id === over.id) : prev.length

      const newTodos = [...prev]
      newTodos[activeIndex] = { ...newTodos[activeIndex], status: targetStatus }
      
      return arrayMove(newTodos, activeIndex, overIndex)
    })
  }

  const handleDragEnd = (event) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const currentTodo = todos.find(t => t.id === active.id)
    if (!currentTodo) return
    
    let newTodos = [...todos]
    const activeIndex = newTodos.findIndex(t => t.id === active.id)
    const overIndex = newTodos.findIndex(t => t.id === over.id)
    
    if (activeIndex !== overIndex && overIndex !== -1) {
      newTodos = arrayMove(newTodos, activeIndex, overIndex)
      setTodos(newTodos)
    }

    const statusChanged = originalTodoStatus && originalTodoStatus !== currentTodo.status

    if (onReorder && (statusChanged || activeIndex !== overIndex)) {
      onReorder(newTodos.map(t => t.id), statusChanged ? active.id : null, statusChanged ? currentTodo.status : null)
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-10 w-full">
        <section>
          <h3 className="text-[14px] font-bold mb-4 tracking-tight text-stone-900 dark:text-stone-100 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            {t('todo.status_todo')}
          </h3>
          <DroppableList id="TODO" items={todoItems.map(t => t.id)}>
            {todoItems.length === 0 && (
              <p className="text-stone-500 text-[14px] font-medium py-2">{t('todo.status_todo_empty')}</p>
            )}
            {todoItems.map(todo => (
              <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onEdit={onEdit} isDraggingActive={activeId === todo.id} />
            ))}
          </DroppableList>
        </section>

        <section className="opacity-80 mt-2">
          <h3 className="text-[14px] font-bold mb-4 tracking-tight text-stone-900 dark:text-stone-100 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {t('todo.status_done')}
          </h3>
          <DroppableList id="DONE" items={doneItems.map(t => t.id)}>
            {doneItems.length === 0 && (
              <p className="text-stone-500 text-[14px] font-medium py-2">{t('todo.status_done_empty')}</p>
            )}
            {doneItems.map(todo => (
              <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onEdit={onEdit} isDraggingActive={activeId === todo.id} />
            ))}
          </DroppableList>
        </section>
      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTodo ? (
          <TodoItemCard 
            todo={activeTodo} 
            isDragging={true} 
            style={{ opacity: 1, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
