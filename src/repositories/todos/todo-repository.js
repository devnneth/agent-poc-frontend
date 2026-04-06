import { supabase } from '../../api/supabase'

// ✅ RLS: 마이그레이션에서 todos 테이블에 이미 완전히 설정됨 (SELECT/INSERT/UPDATE/DELETE 4개 정책)
// ✅ updated_at: DB 트리거(trigger_todos_updated_at)가 UPDATE 시 자동 갱신

// public.todos 테이블에 대한 CRUD를 담당하는 리포지토리
export const TodoRepository = {
  // 사용자의 할일 목록 조회 (소프트 삭제 제외)
  // RLS가 auth.uid()로 자동 필터하지만, owner_user_id도 명시적으로 전달 (Calendar 패턴과 일관성)
  async fetchAll(userId, filters = {}) {
    let query = supabase
      .from('todos')
      .select('*')
      .eq('owner_user_id', userId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  // 단건 조회
  async fetchById(id) {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ?? null
  },

  // 생성
  async create(todoData) {
    const { data, error } = await supabase
      .from('todos')
      .insert([todoData])
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  // 수정 (updated_at은 DB 트리거가 자동 갱신)
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  // 소프트 삭제 (deleted_at 설정, updated_at은 트리거 자동 갱신)
  async softDelete(id) {
    const { error } = await supabase
      .from('todos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  // 순서 변경 (다건 update, updated_at은 트리거 자동 갱신)
  async reorder(updates) {
    const promises = updates.map(({ id, sort_order, status }) => {
      const updateData = { sort_order }
      if (status) updateData.status = status
      return supabase.from('todos').update(updateData).eq('id', id)
    })

    const results = await Promise.all(promises)
    const failed = results.find(r => r.error)
    if (failed?.error) throw failed.error
  },
}
