import { knowledgeRepository } from '../../repositories/knowledge/knowledge-repository'
import {
  uploadKnowledgeFile,
  deleteKnowledgeSource as deleteKnowledgeSourceApi,
  downloadKnowledgeSource as downloadKnowledgeSourceApi,
} from '../../api/knowledge/knowledge-api'

/**
 * 지식 관리 관련 비즈니스 로직을 처리하는 서비스 계층
 */
class KnowledgeService {
  async getKnowledges(userId) {
    return await knowledgeRepository.getAllKnowledges(userId)
  }

  async createKnowledge(userId, data) {
    // knowledgeModel에 정의된 Not Null 컬럼들을 기본값으로 설정하여 생성
    return await knowledgeRepository.createKnowledge({
      user_id: userId,
      title: data.title || '새 지식',
      description: data.description || '',
    })
  }

  async updateKnowledge(id, updates) {
    return await knowledgeRepository.updateKnowledge(id, updates)
  }

  async updateKnowledgeSource(id, updates) {
    return await knowledgeRepository.updateKnowledgeSource(id, updates)
  }

  async deleteKnowledge(id) {
    return await knowledgeRepository.deleteKnowledge(id)
  }

  async getKnowledgeSources(knowledgeId) {
    return await knowledgeRepository.getKnowledgeSources(knowledgeId)
  }

  async uploadKnowledgeSource(knowledgeId, file, accessToken) {
    return await uploadKnowledgeFile(knowledgeId, file, accessToken)
  }

  async deleteKnowledgeSource(knowledgeId, sourceId, accessToken) {
    return await deleteKnowledgeSourceApi(knowledgeId, sourceId, accessToken)
  }

  async downloadKnowledgeSource(knowledgeId, sourceId, accessToken) {
    return await downloadKnowledgeSourceApi(knowledgeId, sourceId, accessToken)
  }
}

export const knowledgeService = new KnowledgeService()
