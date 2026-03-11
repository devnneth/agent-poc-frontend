import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TodoRepository } from '../../../src/repositories/todos/todo-repository'

// supabase 모듈 모킹
vi.mock('../../../src/api/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }

  return {
    supabase: {
      from: vi.fn().mockReturnValue(chain),
      _chain: chain,
    },
  }
})

// 모킹된 supabase와 chain에 접근하기 위한 헬퍼
async function getSupabaseMock() {
  const { supabase } = await import('../../../src/api/supabase')
  return supabase
}

describe('TodoRepository', () => {
  let supabaseMock
  let chain

  beforeEach(async () => {
    vi.clearAllMocks()
    supabaseMock = await getSupabaseMock()
    chain = supabaseMock._chain

    // 기본 체이닝 반환값 재설정
    chain.select.mockReturnThis()
    chain.eq.mockReturnThis()
    chain.is.mockReturnThis()
    chain.order.mockReturnThis()
    chain.insert.mockReturnThis()
    chain.update.mockReturnThis()
    supabaseMock.from.mockReturnValue(chain)
  })

  // ────────────────────────────────────────────────────
  // fetchAll
  // ────────────────────────────────────────────────────
  describe('fetchAll', () => {
    it('소프트 삭제 제외한 할일 목록을 반환한다', async () => {
      const mockTodos = [
        { id: 1, title: '테스트 1', status: 'TODO', deleted_at: null },
        { id: 2, title: '테스트 2', status: 'DONE', deleted_at: null },
      ]
      // order() 이후 await 시나리오: order가 Promise를 반환하도록 설정
      chain.order.mockResolvedValue({ data: mockTodos, error: null })

      const result = await TodoRepository.fetchAll('user-uuid-123')

      expect(supabaseMock.from).toHaveBeenCalledWith('todos')
      expect(chain.eq).toHaveBeenCalledWith('owner_user_id', 'user-uuid-123')
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
      expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true })
      expect(result).toEqual(mockTodos)
    })

    it('Supabase 에러 발생 시 예외를 던진다', async () => {
      chain.order.mockResolvedValue({ data: null, error: new Error('DB 오류') })

      await expect(TodoRepository.fetchAll('user-uuid-123')).rejects.toThrow('DB 오류')
    })
  })

  // ────────────────────────────────────────────────────
  // fetchById
  // ────────────────────────────────────────────────────
  describe('fetchById', () => {
    it('특정 ID의 할일을 단건 조회한다', async () => {
      const mockTodo = { id: 1, title: '단건 조회 테스트', status: 'TODO' }
      chain.single.mockResolvedValue({ data: mockTodo, error: null })

      const result = await TodoRepository.fetchById(1)

      expect(supabaseMock.from).toHaveBeenCalledWith('todos')
      expect(chain.eq).toHaveBeenCalledWith('id', 1)
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
      expect(chain.single).toHaveBeenCalled()
      expect(result).toEqual(mockTodo)
    })

    it('존재하지 않는 항목(PGRST116)은 null을 반환한다', async () => {
      chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

      const result = await TodoRepository.fetchById(999)

      expect(result).toBeNull()
    })

    it('PGRST116 외 에러는 예외를 던진다', async () => {
      chain.single.mockResolvedValue({ data: null, error: { code: 'OTHER_ERROR', message: '다른 에러' } })

      await expect(TodoRepository.fetchById(1)).rejects.toMatchObject({ code: 'OTHER_ERROR' })
    })
  })

  // ────────────────────────────────────────────────────
  // create
  // ────────────────────────────────────────────────────
  describe('create', () => {
    it('데이터를 insert하여 생성한다', async () => {
      const todoData = { owner_user_id: 'user-uuid-123', title: '새 할일', priority: 'normal', status: 'TODO' }
      const createdTodo = { id: 10, ...todoData }
      chain.single.mockResolvedValue({ data: createdTodo, error: null })

      const result = await TodoRepository.create(todoData)

      expect(supabaseMock.from).toHaveBeenCalledWith('todos')
      expect(chain.insert).toHaveBeenCalledWith([todoData])
      expect(chain.select).toHaveBeenCalledWith('*')
      expect(chain.single).toHaveBeenCalled()
      expect(result).toEqual(createdTodo)
    })

    it('insert 에러 발생 시 예외를 던진다', async () => {
      chain.single.mockResolvedValue({ data: null, error: new Error('insert 실패') })

      await expect(TodoRepository.create({ title: '실패 케이스' })).rejects.toThrow('insert 실패')
    })
  })

  // ────────────────────────────────────────────────────
  // update
  // ────────────────────────────────────────────────────
  describe('update', () => {
    it('ID에 해당하는 할일을 수정한다', async () => {
      const updateData = { title: '수정된 제목', priority: 'high' }
      const updatedTodo = { id: 1, ...updateData, status: 'TODO' }
      chain.single.mockResolvedValue({ data: updatedTodo, error: null })

      const result = await TodoRepository.update(1, updateData)

      expect(supabaseMock.from).toHaveBeenCalledWith('todos')
      expect(chain.update).toHaveBeenCalledWith(updateData)
      expect(chain.eq).toHaveBeenCalledWith('id', 1)
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
      expect(chain.single).toHaveBeenCalled()
      expect(result).toEqual(updatedTodo)
    })
  })

  // ────────────────────────────────────────────────────
  // softDelete
  // ────────────────────────────────────────────────────
  describe('softDelete', () => {
    it('deleted_at을 설정하여 소프트 삭제한다', async () => {
      chain.eq.mockResolvedValue({ error: null })

      await TodoRepository.softDelete(1)

      expect(supabaseMock.from).toHaveBeenCalledWith('todos')
      // update 호출 시 deleted_at 키 포함 여부 확인
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) })
      )
      expect(chain.eq).toHaveBeenCalledWith('id', 1)
    })

    it('softDelete 에러 발생 시 예외를 던진다', async () => {
      chain.eq.mockResolvedValue({ error: new Error('삭제 실패') })

      await expect(TodoRepository.softDelete(1)).rejects.toThrow('삭제 실패')
    })
  })

  // ────────────────────────────────────────────────────
  // reorder
  // ────────────────────────────────────────────────────
  describe('reorder', () => {
    it('여러 항목의 sort_order를 일괄 업데이트한다', async () => {
      const updates = [
        { id: 1, sort_order: 0 },
        { id: 2, sort_order: 1 },
        { id: 3, sort_order: 2 },
      ]
      // eq가 각 호출마다 Promise resolve를 반환하도록 설정
      chain.eq.mockResolvedValue({ error: null })

      await TodoRepository.reorder(updates)

      // from이 updates.length 번 호출되어야 함
      expect(supabaseMock.from).toHaveBeenCalledTimes(updates.length)
      updates.forEach(({ sort_order }) => {
        expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ sort_order }))
      })
    })

    it('reorder 중 에러 발생 시 예외를 던진다', async () => {
      const updates = [{ id: 1, sort_order: 0 }]
      chain.eq.mockResolvedValue({ error: new Error('순서 변경 실패') })

      await expect(TodoRepository.reorder(updates)).rejects.toThrow('순서 변경 실패')
    })
  })
})
