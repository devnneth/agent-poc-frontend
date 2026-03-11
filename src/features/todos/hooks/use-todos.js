import { useState, useCallback } from 'react'
import { useTodoList } from './use-todo-list'
import { useTodoActions } from './use-todo-actions'

// 투두 화면의 상태와 로직을 통합 관리하는 Facade 훅
export function useTodos() {
  // 1. 목록 관리
  const { todos, setTodos, loading, error, refetch } = useTodoList()

  // 2. CRUD 액션
  const {
    handleAddTodo,
    handleUpdateTodo,
    handleDeleteTodo,
    handleToggleTodo,
    handleReorderTodos,
    isActionLoading,
  } = useTodoActions(todos, setTodos, refetch)

  // 3. 편집 모달 폼 상태
  const [editingTodo, setEditingTodo] = useState(null)

  const handleEdit = useCallback((todo) => {
    setEditingTodo(todo)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setEditingTodo(null)
  }, [])

  const handleSave = useCallback(
    async (updatedTodo) => {
      const result = await handleUpdateTodo(updatedTodo.id, updatedTodo)
      if (result) {
        setEditingTodo(null)
      }
    },
    [handleUpdateTodo]
  )

  const handleDelete = useCallback(
    async (id) => {
      await handleDeleteTodo(id)
      setEditingTodo(null) // 성공 여부에 관계 없이 모달 닫기
    },
    [handleDeleteTodo]
  )

  return {
    // 목록 상태
    todos,
    loading,
    error,
    setTodos,
    refetch,

    // CRUD 액션
    handleAddTodo,
    handleToggleTodo,
    handleReorderTodos,
    isActionLoading,

    // 편집 모달 관련
    editingTodo,
    handleEdit,
    handleCloseSidebar,
    handleSave,
    handleDelete,
  }
}
