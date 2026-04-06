import { TodoRepository } from '../../repositories/todos/todo-repository'
// 비즈니스 로직 및 도메인 규칙을 처리하는 투두 서비스
export const TodoService = {
  // 할일 목록 조회 — Repository 결과를 UI 포맷으로 변환
  getTodos: async (userId, filters) => {
    const todos = await TodoRepository.fetchAll(userId, filters)
    return todos.map(TodoService.convertToUIFormat)
  },

  // 단건 조회 — UI 포맷으로 변환
  getTodoById: async (id) => {
    const todo = await TodoRepository.fetchById(id)
    return TodoService.convertToUIFormat(todo)
  },

  // 할일 생성 — owner_user_id 포함, 기본값 설정, UI 포맷 반환
  addTodo: async (userId, data) => {

    const created = await TodoRepository.create({
      owner_user_id: userId,
      title: data.title,
      priority: data.priority || 'normal',
      status: 'TODO',
      description: data.description || '',
      project: data.project || '',
      due_date: data.dueDate || null,
      sort_order: data.sortOrder || 0,
    })
    return TodoService.convertToUIFormat(created)
  },

  // 할일 수정 — camelCase → snake_case 변환 후 Repository 호출
  updateTodo: async (id, data) => {
    // 기존 데이터 조회
    const existing = await TodoRepository.fetchById(id)
    if (!existing) return null

    const dbData = {}
    if (data.title !== undefined) dbData.title = data.title
    if (data.description !== undefined) dbData.description = data.description
    if (data.status !== undefined) dbData.status = data.status
    if (data.priority !== undefined) dbData.priority = data.priority
    if (data.project !== undefined) dbData.project = data.project
    if (data.dueDate !== undefined) dbData.due_date = data.dueDate
    if (data.sortOrder !== undefined) dbData.sort_order = data.sortOrder

    const updated = await TodoRepository.update(id, dbData)
    return TodoService.convertToUIFormat(updated)
  },

  // 할일 소프트 삭제
  deleteTodo: async (id) => {
    return await TodoRepository.softDelete(id)
  },

  // 상태 토글 (TODO ↔ DONE)
  toggleTodoStatus: async (id, currentStatus) => {
    const newStatus = currentStatus === 'TODO' ? 'DONE' : 'TODO'
    return await TodoRepository.update(id, { status: newStatus })
  },

  // 순서 변경 — updates: [{ id, sort_order, status? }]
  reorderTodos: async (updates) => {
    return await TodoRepository.reorder(updates)
  },

  // DB 포맷(snake_case) → UI 포맷(camelCase) 변환 유틸
  convertToUIFormat: (todo) => {
    if (!todo) return null
    return {
      id: todo.id,
      title: todo.title,
      status: todo.status,
      priority: todo.priority || 'normal',
      project: todo.project || '',
      description: todo.description || '',
      dueDate: todo.due_date || null,
      sortOrder: todo.sort_order ?? 0,
      updatedAt: todo.updated_at,
      createdAt: todo.created_at,
    }
  },
}
