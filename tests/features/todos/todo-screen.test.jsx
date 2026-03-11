import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TodoScreen } from '../../../src/features/todos/screens/todo-screen'
import { useTodos } from '../../../src/features/todos/hooks/use-todos'

// 모킹: 번역 모듈
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}))

// 모킹: useTodos
vi.mock('../../../src/features/todos/hooks/use-todos', () => ({
  useTodos: vi.fn(),
}))

const mockHandleAddTodo = vi.fn()
const mockHandleToggleTodo = vi.fn()
const mockHandleReorderTodos = vi.fn()
const mockSetTodos = vi.fn()
const mockHandleEdit = vi.fn()
const mockHandleCloseSidebar = vi.fn()
const mockHandleSave = vi.fn()
const mockHandleDelete = vi.fn()

const baseMockReturn = {
  todos: [],
  loading: false,
  error: null,
  handleAddTodo: mockHandleAddTodo,
  handleToggleTodo: mockHandleToggleTodo,
  handleReorderTodos: mockHandleReorderTodos,
  setTodos: mockSetTodos,
  editingTodo: null,
  handleEdit: mockHandleEdit,
  handleCloseSidebar: mockHandleCloseSidebar,
  handleSave: mockHandleSave,
  handleDelete: mockHandleDelete,
  isActionLoading: false,
}

describe('TodoScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTodos.mockReturnValue(baseMockReturn)
  })

  // 1. 목록 렌더링
  it('할 일 목록이 화면에 렌더링된다', () => {
    useTodos.mockReturnValue({
      ...baseMockReturn,
      todos: [
        { id: '1', title: 'Test Todo 1', status: 'TODO', updatedAt: new Date().toISOString() },
        { id: '2', title: 'Test Todo 2', status: 'DONE', updatedAt: new Date().toISOString() },
      ],
    })

    render(<TodoScreen />)
    expect(screen.getByText('todo.title')).toBeInTheDocument()
    expect(screen.getByText('Test Todo 1')).toBeInTheDocument()
    expect(screen.getByText('Test Todo 2')).toBeInTheDocument()
  })

  // 2. 로딩 메시지
  it('로딩 중 상태가 표시된다', () => {
    useTodos.mockReturnValue({
      ...baseMockReturn,
      loading: true,
    })

    render(<TodoScreen />)
    expect(screen.getByText('todo.loading')).toBeInTheDocument()
  })

  // 3. 빈 목록 상태
  it('빈 목록일 때 빈 상태 메시지가 표시된다', () => {
    render(<TodoScreen />) // 기본이 빈 배열
    expect(screen.getByText('todo.empty_text')).toBeInTheDocument()
  })

  // 4. Enter 기본 추가
  it('입력 후 Enter 누르면 할 일이 추가된다', async () => {
    mockHandleAddTodo.mockResolvedValue(undefined)
    render(<TodoScreen />)

    const input = screen.getByPlaceholderText('todo.input_placeholder')
    fireEvent.change(input, { target: { value: '새 할일' } })
    
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    })

    expect(mockHandleAddTodo).toHaveBeenCalledWith({
      title: '새 할일',
      priority: 'normal',
    })
  })

  // 5. 버튼 클릭 추가
  it('추가 버튼 클릭으로 할 일이 추가된다', async () => {
    mockHandleAddTodo.mockResolvedValue(undefined)
    render(<TodoScreen />)

    const input = screen.getByPlaceholderText('todo.input_placeholder')
    fireEvent.change(input, { target: { value: '버튼 할일' } })

    const btn = screen.getByRole('button', { name: 'todo.add' })
    
    await act(async () => {
      fireEvent.click(btn)
    })

    expect(mockHandleAddTodo).toHaveBeenCalledWith({
      title: '버튼 할일',
      priority: 'normal',
    })
  })

  // 6. 빈 입력 무시
  it('빈 입력으로 추가 시도 시 무시된다', async () => {
    render(<TodoScreen />)

    const input = screen.getByPlaceholderText('todo.input_placeholder')
    
    // 빈 칸에서 엔터
    fireEvent.change(input, { target: { value: '   ' } })
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    })
    
    // 추가 버튼 클릭 (disabled라서 안 눌리지만 명시적 호출 방어테스트)
    const btn = screen.getByRole('button', { name: 'todo.add' })
    await act(async () => {
      fireEvent.click(btn)
    })

    expect(mockHandleAddTodo).not.toHaveBeenCalled()
  })
})
