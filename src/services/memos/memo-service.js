import { memoRepository } from '../../repositories/memos/memo-repository'
import { embeddingService } from '../embedding-service'
import { embeddingRepository } from '../../repositories/embedding-repository'

/**
 * 메모 관련 비즈니스 로직을 처리하는 서비스 클래스
 */
class MemoService {
  /**
   * 메모 목록을 검색어에 따라 필터링하여 가져옵니다.
   */
  async getMemos(userId, searchQuery = '') {
    const allMemos = await memoRepository.getAll(userId)
    if (!searchQuery) return allMemos

    const query = searchQuery.toLowerCase()
    return allMemos.filter(memo => 
      memo.title.toLowerCase().includes(query) || 
      memo.content.toLowerCase().includes(query)
    )
  }

  /**
   * 새로운 빈 메모를 생성합니다.
   */
  async createNewMemo(userId, accessToken) {
    // 임베딩 생성 (실패해도 진행)
    let embeddingId = null
    try {
      const embeddingVector = await embeddingService.createEmbedding({
        payload: {
          entity: 'MemoModel',
          title: '새 메모',
          content: '',
        },
        accessToken,
      })

      if (embeddingVector) {
        embeddingId = await embeddingRepository.create({
          embedding: embeddingVector,
          modelName: import.meta.env.VITE_EMBEDDING_MODEL || 'text-embedding-3-small',
        })
      }
    } catch (e) {
      console.warn('Memo embedding flow failed:', e)
    }

    return await memoRepository.create({
      owner_user_id: userId,
      title: '새 메모',
      content: '',
      embedding_id: embeddingId,
    })
  }

  /**
   * 메모 내용을 수정합니다.
   */
  async updateMemo(id, updates, accessToken) {
    // 기존 데이터 조회
    const existing = await memoRepository.getById(id)
    
    // 임베딩 갱신 (실패해도 진행)
    let embeddingId = existing?.embedding_id
    if (updates.title !== undefined || updates.content !== undefined) {
      try {
        const embeddingVector = await embeddingService.createEmbedding({
          payload: {
            entity: 'MemoModel',
            title: updates.title !== undefined ? updates.title : existing?.title || '',
            content: updates.content !== undefined ? updates.content : existing?.content || '',
          },
          accessToken,
        })

        if (embeddingVector) {
          if (embeddingId) {
            await embeddingRepository.update(embeddingId, {
              embedding: embeddingVector,
            })
          } else {
            embeddingId = await embeddingRepository.create({
              embedding: embeddingVector,
              modelName: import.meta.env.VITE_EMBEDDING_MODEL || 'text-embedding-3-small',
            })
          }
        }
      } catch (e) {
        console.warn('Memo embedding update flow failed:', e)
      }
    }

    return await memoRepository.update(id, { ...updates, embedding_id: embeddingId })
  }

  /**
   * 메모를 삭제합니다.
   */
  async deleteMemo(id) {
    return await memoRepository.delete(id)
  }
}

export const memoService = new MemoService()
