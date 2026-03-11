import { supabase } from '../api/supabase';

// public.google_calendar_events 테이블에 대한 CRUD를 담당하는 리포지토리
export const googleCalendarEventRepository = {
  /**
   * 기간 내 이벤트 목록 조회 (소프트 삭제 제외)
   * @param {string} startAt - ISO 8601 시작 시각
   * @param {string} endAt - ISO 8601 종료 시각
   * @returns {Promise<Array>}
   */
  async findByPeriod(startAt, endAt) {
    const { data, error } = await supabase
      .from('google_calendar_events')
      .select('*')
      .gte('start_at', startAt)
      .lte('end_at', endAt)
      .is('deleted_at', null)
      .order('start_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * 단건 조회
   * @param {number} id - 이벤트 PK
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('google_calendar_events')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  },

  /**
   * 이벤트 생성
   * @param {Object} eventData - { google_calendar_id, google_event_id?, owner_user_id, summary, description?, color_id?, icon?, start_at, end_at, embedding_id? }
   * @returns {Promise<Object>} 생성된 이벤트
   */
  async create(eventData) {
    const { data, error } = await supabase
      .from('google_calendar_events')
      .insert([eventData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 이벤트 수정
   * @param {number} id - 이벤트 PK
   * @param {Object} updateData - 수정할 필드
   * @returns {Promise<Object>} 수정된 이벤트
   */
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('google_calendar_events')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 소프트 삭제 (deleted_at 설정)
   * @param {number} id - 이벤트 PK
   * @returns {Promise<void>}
   */
  async softDelete(id) {
    const { error } = await supabase
      .from('google_calendar_events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
