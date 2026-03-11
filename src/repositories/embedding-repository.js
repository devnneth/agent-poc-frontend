import { supabase } from '../api/supabase';

/**
 * 임베딩 데이터를 별도의 테이블에 저장하고 관리하는 리포지토리
 */
export const embeddingRepository = {
  /**
   * 임베딩 데이터 저장
   * 1. event_embeddings_base 테이블에 메타데이터 저장 및 ID 확보
   * 2. 차원에 맞는 벡터 테이블(event_embedding_1024 등)에 벡터 저장
   * @param {Object} params - { embedding: number[], modelName: string }
   * @returns {Promise<number>} 생성된 임베딩 ID
   */
  async create({ embedding, modelName }) {
    if (!Array.isArray(embedding)) {
      throw new Error('EMBEDDING_DATA_INVALID');
    }

    const dimension = embedding.length;

    // 1. 베이스 테이블 저장
    const { data: baseData, error: baseError } = await supabase
      .from('event_embeddings_base')
      .insert([
        {
          model_name: modelName,
          dimension: dimension,
        },
      ])
      .select('id')
      .single();

    if (baseError) throw baseError;

    const embeddingId = baseData.id;

    // 2. 차원별 벡터 테이블 저장 (현재 1024, 1536, 768 지원 가정)
    const tableName = `event_embeddings_${dimension}`;
    const { error: vecError } = await supabase
      .from(tableName)
      .insert([
        {
          id: embeddingId,
          embedding: embedding,
        },
      ]);

    if (vecError) {
      // 보상 트랜잭션: 베이스 데이터 삭제 시도 (선택 사항)
      await supabase.from('event_embeddings_base').delete().eq('id', embeddingId);
      throw vecError;
    }

    return embeddingId;
  },

  /**
   * 임베딩 데이터 업데이트
   * @param {number} embeddingId - 기존 임베딩 ID
   * @param {Object} params - { embedding: number[] }
   */
  async update(embeddingId, { embedding }) {
    if (!embeddingId || !Array.isArray(embedding)) {
      throw new Error('EMBEDDING_UPDATE_INVALID');
    }

    const dimension = embedding.length;
    const tableName = `event_embeddings_${dimension}`;

    const { error } = await supabase
      .from(tableName)
      .update({ embedding })
      .eq('id', embeddingId);

    if (error) throw error;
  },
};
