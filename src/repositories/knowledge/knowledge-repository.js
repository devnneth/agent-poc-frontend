import { supabase } from '../../api/supabase'

/**
 * 지식 관리(Knowledge) 및 지식 소스(Knowledge Sources) 영속성을 관리하는 저장소
 */
class KnowledgeRepository {
  /**
   * 사용자의 모든 지식 컬렉션을 가져옵니다.
   */
  async getAllKnowledges(userId) {
    const { data, error } = await supabase
      .from('knowledges')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * 새 지식 컬렉션을 저장합니다.
   */
  async createKnowledge(knowledgeData) {
    const { data, error } = await supabase
      .from('knowledges')
      .insert([knowledgeData])
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  /**
   * 지식 컬렉션을 업데이트합니다.
   */
  async updateKnowledge(id, knowledgeData) {
    const { data, error } = await supabase
      .from('knowledges')
      .update({ ...knowledgeData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  /**
   * 지식 소스를 업데이트합니다.
   */
  async updateKnowledgeSource(id, sourceData) {
    const { data, error } = await supabase
      .from('knowledge_sources')
      .update({ ...sourceData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  /**
   * 지식 컬렉션을 삭제(Soft Delete)합니다.
   */
  async deleteKnowledge(id) {
    const { error } = await supabase
      .from('knowledges')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  /**
   * 특정 지식 컬렉션에 속한 데이터 소스(파일/URL 등) 목록을 가져옵니다.
   */
  async getKnowledgeSources(knowledgeId) {
    const { data, error } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('knowledge_id', knowledgeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * 특정 지식 소스를 삭제(Soft Delete)합니다.
   */
  async deleteKnowledgeSource(id) {
    const { error } = await supabase
      .from('knowledge_sources')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }
}

export const knowledgeRepository = new KnowledgeRepository()
