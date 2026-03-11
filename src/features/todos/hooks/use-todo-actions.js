import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TodoService } from '../../../services/todos/todo-service'
import { useAuthSession } from '../../auth/hooks/use-auth-session'
import { useToast } from '../../../hooks/use-toast'

// 투두 CRUD 액션과 Optimistic Update를 처리하는 훅
export function useTodoActions(todos, setTodos, refetch) {
  const { t } = useTranslation()
  const { session } = useAuthSession()
  const { toast } = useToast()
  const [isActionLoading, setIsActionLoading] = useState(false)

  const handleAddTodo = useCallback(async (data) => {
    if (!session?.user?.id) return

    setIsActionLoading(true)
    try {
      const added = await TodoService.addTodo(session.user.id, data, session.access_token)
      setTodos((prev) => [added, ...prev])
      toast({ title: t('todo.toast_add_success_title'), description: t('todo.toast_add_success_desc') })
      return added
    } catch (e) {
      console.error('할 일 추가 실패:', e)
      toast({ variant: 'destructive', title: t('common.error'), description: t('todo.toast_add_error_desc') })
      refetch()
    } finally {
      setIsActionLoading(false)
    }
  }, [session?.user?.id, session?.access_token, setTodos, refetch, toast, t])

  const handleUpdateTodo = useCallback(async (id, data) => {
    setIsActionLoading(true)
    try {
      const updated = await TodoService.updateTodo(id, data, session.access_token)
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
      toast({ title: t('todo.toast_update_success_title'), description: t('todo.toast_update_success_desc') })
      return updated
    } catch (e) {
      console.error('할 일 수정 실패:', e)
      toast({ variant: 'destructive', title: t('common.error'), description: t('todo.toast_update_error_desc') })
      refetch()
    } finally {
      setIsActionLoading(false)
    }
  }, [session?.access_token, setTodos, refetch, toast, t])

  const handleDeleteTodo = useCallback(async (id) => {
    setIsActionLoading(true)
    // Optimistic Delete
    const previousTodos = [...todos]
    setTodos((prev) => prev.filter((t) => t.id !== id))
    
    try {
      await TodoService.deleteTodo(id)
      toast({ title: t('todo.toast_delete_success_title'), description: t('todo.toast_delete_success_desc') })
    } catch (e) {
      console.error('할 일 삭제 실패:', e)
      setTodos(previousTodos) // 실패 시 롤백
      toast({ variant: 'destructive', title: t('common.error'), description: t('todo.toast_delete_error_desc') })
    } finally {
      setIsActionLoading(false)
    }
  }, [todos, setTodos, toast, t])

  const handleToggleTodo = useCallback(async (id, currentStatus) => {
    // Optimistic Toggle
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: currentStatus === 'TODO' ? 'DONE' : 'TODO' } : t
      )
    )

    try {
      await TodoService.toggleTodoStatus(id, currentStatus)
    } catch (e) {
      console.error('상태 변경 실패:', e)
      refetch() // 실패 시 다시 불러오기
      toast({ variant: 'destructive', title: t('common.error'), description: t('todo.toast_status_error_desc') })
    }
  }, [setTodos, refetch, toast, t])

  const handleReorderTodos = useCallback(async (updates) => {
    try {
      await TodoService.reorderTodos(updates)
    } catch (e) {
      console.error('순서 변경 실패:', e)
      refetch() // 실패 시 다시 불러오기
      toast({ variant: 'destructive', title: t('common.error'), description: t('todo.toast_reorder_error_desc') })
    }
  }, [refetch, toast, t])

  return {
    handleAddTodo,
    handleUpdateTodo,
    handleDeleteTodo,
    handleToggleTodo,
    handleReorderTodos,
    isActionLoading,
  }
}
