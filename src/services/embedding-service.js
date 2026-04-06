const DEFAULT_TIMEOUT_MS = Number.parseInt(
  import.meta.env.VITE_EMBEDDING_TIMEOUT_MS,
  10
) || 8000;
const DEFAULT_PATH =
  import.meta.env.VITE_EMBEDDING_PATH || '/api/v1/llm/embedding';
const TEXTS_KEY = import.meta.env.VITE_EMBEDDING_TEXTS_KEY || 'texts';
const DIMENSIONS = Number.parseInt(
  import.meta.env.VITE_EMBEDDING_DIMENSIONS,
  10
);

function getBackendUrl() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
  return baseUrl.replace(/\/+$/, '');
}

function buildAuthorizationHeader(accessToken) {
  if (!accessToken) return '';
  if (accessToken.toLowerCase().startsWith('bearer ')) return accessToken;
  return `Bearer ${accessToken}`;
}


function normalizeEmbeddingResponse(payload) {
  // 백엔드에서 제공한 'result' 필드가 벡터 배열인 경우 처리
  if (Array.isArray(payload?.result)) {
    return payload.result;
  }

  // OpenAI 스타일: { data: [{ embedding: [...] }] }
  if (Array.isArray(payload?.data) && Array.isArray(payload.data[0]?.embedding)) {
    return payload.data[0].embedding;
  }

  const embeddings = payload?.embeddings ?? payload?.data?.embeddings;

  if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
    return embeddings[0];
  }

  console.error('Invalid embedding response structure:', payload);
  throw new Error('EMBEDDING_MISSING');
}

async function createEmbedding({ payload, accessToken, signal }) {
  if (!payload || !payload.entity) {
    throw new Error('EMBEDDING_PAYLOAD_INVALID');
  }

  const baseUrl = getBackendUrl();
  if (!baseUrl) {
    throw new Error('BACKEND_URL_MISSING');
  }

  const headers = { 'Content-Type': 'application/json' };
  const authorization = buildAuthorizationHeader(accessToken);
  if (authorization) headers.authorization = authorization;

  const controller = signal ? null : new AbortController();
  const activeSignal = signal ?? controller.signal;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(`${baseUrl}${DEFAULT_PATH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: activeSignal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Embedding request failed (${response.status})`);
    }

    const result = await response.json();
    return normalizeEmbeddingResponse(result);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const embeddingService = { createEmbedding };
