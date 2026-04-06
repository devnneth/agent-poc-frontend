import { supabase } from '../../api/supabase'

/**
 * 메모 데이터 영속성을 관리하는 저장소 클래스 (Supabase 직접 연동)
 */
class MemoRepository {
  /**
   * 모든 메모를 가져옵니다. 필요 시 검색어를 통해 필터링합니다.
   */
  async getAll(userId, searchQuery = '') {
    let query = supabase
      .from('memos')
      .select('*')
      .eq('owner_user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * 단건 조회
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ?? null
  }

  /**
   * 새 메모를 저장합니다.
   */
  async create(memoData) {
    const { data, error } = await supabase
      .from('memos')
      .insert([memoData])
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  /**
   * 메모를 업데이트합니다.
   */
  async update(id, memoData) {
    const { data, error } = await supabase
      .from('memos')
      .update({ ...memoData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  /**
   * 메모를 소프트 삭제합니다.
   */
  async delete(id) {
    const { error } = await supabase
      .from('memos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }
}

export const memoRepository = new MemoRepository()
