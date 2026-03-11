import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTodos } from '../../../src/features/todos/hooks/use-todos'
import { TodoService } from '../../../src/services/todos/todo-service'

// 1. 필요한 외부 모듈/훅 몽땅 모킹
vi.mock('../../../src/services/todos/todo-service', () => ({
  TodoService: {
    getTodos: vi.fn(),
    addTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
    toggleTodoStatus: vi.fn(),
  },
}))

vi.mock('../../../src/features/auth/hooks/use-auth-session', () => ({
  useAuthSession: vi.fn().mockReturnValue({ session: { user: { id: 'user-uuid' } } }),
}))

const mockToast = vi.fn()
vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

// 기본 픽스처
const MOCK_TODO = { id: 1, title: '테스트 할 일', status: 'TODO' }

describe('useTodos Facade Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 공통: 컴포넌트 마운트 시 getTodos()가 호출됨을 가정
    TodoService.getTodos.mockResolvedValue([MOCK_TODO])
  })

  // 1. 목록 조회
  it('할 일 목록을 성공적으로 조회한다', async () => {
    const { result } = renderHook(() => useTodos())

    // 맨 처음엔 로딩 상태 (useState 기본값 false지만 useEffect 실행되면서 true)
    // 약간 비동기 이슈가 있으니 waitFor로 loading false 진입 시점을 먼저 확보
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(TodoService.getTodos).toHaveBeenCalledWith('user-uuid')
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0]).toEqual(MOCK_TODO)
  })

  // 2. 항목 추가
  it('할 일 추가 시 목록에 즉시 반영된다', async () => {
    const newTodo = { id: 2, title: '새로운 할 일', status: 'TODO' }
    TodoService.addTodo.mockResolvedValue(newTodo)

    const { result } = renderHook(() => useTodos())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.handleAddTodo({ title: '새로운 할 일' })
    })

    expect(TodoService.addTodo).toHaveBeenCalledWith('user-uuid', { title: '새로운 할 일' }, undefined)
    expect(result.current.todos).toHaveLength(2)
    // 새로 추가된 애가 앞에 옴 ([added, ...prev])
    expect(result.current.todos[0]).toEqual(newTodo)
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'todo.toast_add_success_title' }))
  })

  // 3. 토글 성공 (Optimistic Update)
  it('할 일 토글 시 Optimistic Update가 적용된다', async () => {
    TodoService.toggleTodoStatus.mockResolvedValue({}) // 반환값 안 씀

    const { result } = renderHook(() => useTodos())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // TODO -> DONE 전환
    await act(async () => {
      await result.current.handleToggleTodo(1, 'TODO')
    })

    // 실패 전이므로 즉시 상태 변경 확인
    expect(result.current.todos[0].status).toBe('DONE')
    expect(TodoService.toggleTodoStatus).toHaveBeenCalledWith(1, 'TODO')
  })

  // 4. 토글 실패
  it('할 일 토글 실패 시 에러 토스트 후 refetch 된다', async () => {
    // 일부러 에러 발생
    TodoService.toggleTodoStatus.mockRejectedValue(new Error('전환 실패'))
    
    const { result } = renderHook(() => useTodos())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // 호출 카운트 초기화 (마운트 시 발생한 getTodos 제거)
    TodoService.getTodos.mockClear()

    await act(async () => {
      await result.current.handleToggleTodo(1, 'TODO')
    })

    // 토클 실패로 인해 refetch(즉 getTodos) 호출되어야 함
    expect(TodoService.getTodos).toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive', title: 'common.error' })
    )
  })

  // 5. 삭제 성공 (Optimistic Delete)
  it('할 일 삭제 시 목록에서 즉시 제거된다', async () => {
    TodoService.deleteTodo.mockResolvedValue({}) // 검증용

    const { result } = renderHook(() => useTodos())
    await waitFor(() => {
      expect(result.current.todos).toHaveLength(1)
    })

    await act(async () => {
      await result.current.handleDelete(1) // Facade는 handleDelete 노출
    })

    expect(result.current.todos).toHaveLength(0) // 모달 닫히고 항목 삭제됨
    expect(result.current.editingTodo).toBeNull() // 모달 관련 상태 리셋 검증
    expect(TodoService.deleteTodo).toHaveBeenCalledWith(1)
  })

  // 6. 삭제 실패 (Rollback)
  it('할 일 삭제 실패 시 원래 목록으로 롤백된다', async () => {
    TodoService.deleteTodo.mockRejectedValue(new Error('삭제 과정 에러'))

    const { result } = renderHook(() => useTodos())
    await waitFor(() => {
      expect(result.current.todos).toHaveLength(1)
    })

    await act(async () => {
      await result.current.handleDelete(1)
    })

    // 에러 났으므로 원래 목록 유지
    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0]).toEqual(MOCK_TODO)
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive', description: 'todo.toast_delete_error_desc' })
    )
  })

  // 7. API 오류 발생 시 error 상태 설정
  it('API 오류 시 error 상태가 설정된다', async () => {
    TodoService.getTodos.mockRejectedValue(new Error('네트워크 끊김'))

    const { result } = renderHook(() => useTodos())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.todos).toHaveLength(0)
    expect(result.current.error).toBe('todo.error_fetch')
  })
})
