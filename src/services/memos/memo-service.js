import { memoRepository } from '../../repositories/memos/memo-repository'
/**
 * 메모 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
class MemoService {
  /**
   * 메모 목록을 검색어에 따라 필터링하여 가져옵니다.
   * (검색 로직은 Supabase DB/PGroonga 인덱스로 위임)
   */
  async getMemos(userId, searchQuery = '') {
    return await memoRepository.getAll(userId, searchQuery)
  }

  /**
   * 새로운 빈 메모를 생성합니다.
   */
  async createNewMemo(userId) {

    return await memoRepository.create({
      owner_user_id: userId,
      title: '새 메모',
      content: '',
    })
  }

  /**
   * 메모 내용을 수정합니다.
   */
  async updateMemo(id, updates) {
    // 기존 데이터 조회 (존재 여부 검증용, 필요 시 에러 처리 추가 가능)
    const existing = await memoRepository.getById(id)
    if (!existing) throw new Error('Memo not found')
    
    return await memoRepository.update(id, { ...updates })
  }

  /**
   * 메모를 삭제합니다.
   */
  async deleteMemo(id) {
    return await memoRepository.delete(id)
  }
}

export const memoService = new MemoService()
