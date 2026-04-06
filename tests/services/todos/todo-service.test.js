import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TodoService } from '../../../src/services/todos/todo-service'
import { TodoRepository } from '../../../src/repositories/todos/todo-repository'

// TodoRepository 전체 모킹
vi.mock('../../../src/repositories/todos/todo-repository', () => ({
  TodoRepository: {
    fetchAll: vi.fn(),
    fetchById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    reorder: vi.fn(),
  },
}))

// DB 포맷 픽스처 (snake_case)
const DB_TODO = {
  id: 1,
  title: '테스트 할일',
  status: 'TODO',
  priority: 'normal',
  project: '테스트 프로젝트',
  description: '설명',
  due_date: '2026-03-31',
  sort_order: 0,
  updated_at: '2026-03-05T00:00:00Z',
  created_at: '2026-03-05T00:00:00Z',
}

// UI 포맷 픽스처 (camelCase)
const UI_TODO = {
  id: 1,
  title: '테스트 할일',
  status: 'TODO',
  priority: 'normal',
  project: '테스트 프로젝트',
  description: '설명',
  dueDate: '2026-03-31',
  sortOrder: 0,
  updatedAt: '2026-03-05T00:00:00Z',
  createdAt: '2026-03-05T00:00:00Z',
}

describe('TodoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ────────────────────────────────────────────────────
  // getTodos
  // ────────────────────────────────────────────────────
  describe('getTodos', () => {
    it('Repository 결과를 UI 포맷으로 변환하여 반환한다', async () => {
      TodoRepository.fetchAll.mockResolvedValue([DB_TODO])

      const result = await TodoService.getTodos('user-uuid-123')

      expect(TodoRepository.fetchAll).toHaveBeenCalledWith('user-uuid-123', undefined)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(UI_TODO)
    })
  })

  // ────────────────────────────────────────────────────
  // addTodo
  // ────────────────────────────────────────────────────
  describe('addTodo', () => {
    it('owner_user_id 포함하여 생성하고 UI 포맷으로 반환한다', async () => {
      TodoRepository.create.mockResolvedValue(DB_TODO)

      const inputData = { title: '테스트 할일', priority: 'normal' }
      const result = await TodoService.addTodo('user-uuid-123', inputData)

      expect(TodoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_user_id: 'user-uuid-123',
          title: '테스트 할일',
          priority: 'normal',
          status: 'TODO',
        })
      )
      expect(result).toEqual(UI_TODO)
    })

    it('priority 기본값이 normal로 설정된다', async () => {
      TodoRepository.create.mockResolvedValue({ ...DB_TODO, priority: 'normal' })

      await TodoService.addTodo('user-uuid-123', { title: '기본값 테스트' })

      expect(TodoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'normal', status: 'TODO' })
      )
    })
  })

  // ────────────────────────────────────────────────────
  // updateTodo
  // ────────────────────────────────────────────────────
  describe('updateTodo', () => {
    it('camelCase 입력을 snake_case로 변환하여 Repository.update를 호출한다', async () => {
      TodoRepository.fetchById.mockResolvedValue(DB_TODO)
      TodoRepository.update.mockResolvedValue(DB_TODO)

      const updateInput = { title: '수정된 제목', dueDate: '2026-04-01', sortOrder: 2 }
      const result = await TodoService.updateTodo(1, updateInput)

      expect(TodoRepository.update).toHaveBeenCalledWith(1, {
        title: '수정된 제목',
        due_date: '2026-04-01',
        sort_order: 2,
      })
      expect(result).toEqual(UI_TODO)
    })

    it('undefined 필드는 DB 데이터에 포함하지 않는다', async () => {
      TodoRepository.fetchById.mockResolvedValue(DB_TODO)
      TodoRepository.update.mockResolvedValue(DB_TODO)

      await TodoService.updateTodo(1, { title: '제목만 수정' })

      const calledArg = TodoRepository.update.mock.calls[0][1]
      expect(calledArg).not.toHaveProperty('due_date')
      expect(calledArg).not.toHaveProperty('sort_order')
      expect(calledArg).toHaveProperty('title', '제목만 수정')
    })
  })

  // ────────────────────────────────────────────────────
  // deleteTodo
  // ────────────────────────────────────────────────────
  describe('deleteTodo', () => {
    it('Repository.softDelete를 호출한다', async () => {
      TodoRepository.softDelete.mockResolvedValue(undefined)

      await TodoService.deleteTodo(1)

      expect(TodoRepository.softDelete).toHaveBeenCalledWith(1)
    })
  })

  // ────────────────────────────────────────────────────
  // toggleTodoStatus
  // ────────────────────────────────────────────────────
  describe('toggleTodoStatus', () => {
    it('TODO 상태는 DONE으로 전환한다', async () => {
      TodoRepository.update.mockResolvedValue({ ...DB_TODO, status: 'DONE' })

      await TodoService.toggleTodoStatus(1, 'TODO')

      expect(TodoRepository.update).toHaveBeenCalledWith(1, { status: 'DONE' })
    })

    it('DONE 상태는 TODO로 전환한다', async () => {
      TodoRepository.update.mockResolvedValue({ ...DB_TODO, status: 'TODO' })

      await TodoService.toggleTodoStatus(1, 'DONE')

      expect(TodoRepository.update).toHaveBeenCalledWith(1, { status: 'TODO' })
    })
  })

  // ────────────────────────────────────────────────────
  // convertToUIFormat
  // ────────────────────────────────────────────────────
  describe('convertToUIFormat', () => {
    it('DB snake_case 필드를 camelCase UI 필드로 올바르게 변환한다', () => {
      const result = TodoService.convertToUIFormat(DB_TODO)

      expect(result).toEqual(UI_TODO)
    })

    it('null 입력 시 null을 반환한다', () => {
      const result = TodoService.convertToUIFormat(null)

      expect(result).toBeNull()
    })

    it('priority, project, description이 없으면 기본값을 적용한다', () => {
      const minimalTodo = { id: 2, title: '최소 할일', status: 'TODO', sort_order: 0 }
      const result = TodoService.convertToUIFormat(minimalTodo)

      expect(result.priority).toBe('normal')
      expect(result.project).toBe('')
      expect(result.description).toBe('')
      expect(result.dueDate).toBeNull()
      expect(result.sortOrder).toBe(0)
    })
  })
})
