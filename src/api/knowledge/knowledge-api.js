const DEFAULT_ERROR_MESSAGE = '요청을 처리하는 중 오류가 발생했습니다.'

function getBackendUrl() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || ''
  return baseUrl.replace(/\/+$/, '')
}

function buildAuthorizationHeader(accessToken) {
  if (!accessToken) return ''
  if (accessToken.toLowerCase().startsWith('bearer ')) return accessToken
  return `Bearer ${accessToken}`
}

async function parseErrorResponse(response) {
  try {
    const data = await response.json()
    return data?.detail || data?.message || DEFAULT_ERROR_MESSAGE
  } catch {
    return DEFAULT_ERROR_MESSAGE
  }
}

function parseFilenameFromDisposition(contentDisposition) {
  if (!contentDisposition) return null

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const filenameMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i)
  return filenameMatch?.[1] || filenameMatch?.[2]?.trim() || null
}

export async function uploadKnowledgeFile(knowledgeId, file, accessToken) {
  const baseUrl = getBackendUrl()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${baseUrl}/api/v1/knowledge/${knowledgeId}/upload`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthorizationHeader(accessToken),
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response))
  }

  return await response.json()
}

export async function deleteKnowledgeSource(knowledgeId, sourceId, accessToken) {
  const baseUrl = getBackendUrl()
  const response = await fetch(`${baseUrl}/api/v1/knowledge/${knowledgeId}/sources/${sourceId}`, {
    method: 'DELETE',
    headers: {
      Authorization: buildAuthorizationHeader(accessToken),
    },
  })

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response))
  }
}

export async function downloadKnowledgeSource(knowledgeId, sourceId, accessToken) {
  const baseUrl = getBackendUrl()
  const response = await fetch(`${baseUrl}/api/v1/knowledge/${knowledgeId}/sources/${sourceId}/download`, {
    method: 'GET',
    headers: {
      Authorization: buildAuthorizationHeader(accessToken),
    },
  })

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response))
  }

  return {
    blob: await response.blob(),
    filename: parseFilenameFromDisposition(response.headers.get('Content-Disposition')),
  }
}
