import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TodoService } from '../../../services/todos/todo-service'
import { useAuthSession } from '../../auth/hooks/use-auth-session'

// 투두 목록 조회 및 상태를 관리하는 훅
export function useTodoList() {
  const { t } = useTranslation()
  const { session } = useAuthSession()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTodos = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    setError(null)

    try {
      const data = await TodoService.getTodos(session.user.id)
      setTodos(data)
    } catch (e) {
      console.error('할 일 목록 조회 실패:', e)
      setError(t('todo.error_fetch'))
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, t])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  return { todos, setTodos, loading, error, refetch: fetchTodos }
}
