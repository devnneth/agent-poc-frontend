/**
 * 에이전트 관련 백엔드 API와의 통신을 담당하는 어댑터
 */

const DEFAULT_ERROR_MESSAGE = "요청을 처리하는 중 오류가 발생했습니다.";

function getBackendUrl() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "";
  return baseUrl.replace(/\/+$/, "");
}

function buildAuthorizationHeader(accessToken) {
  if (!accessToken) return "";
  if (accessToken.toLowerCase().startsWith("bearer ")) return accessToken;
  return `Bearer ${accessToken}`;
}

/**
 * 단일 세션을 삭제한다
 * DELETE /api/v1/agent/session/{session_id}
 */
export async function deleteSession(sessionId, accessToken) {
  const baseUrl = getBackendUrl();
  const headers = {
    "Content-Type": "application/json",
    Authorization: buildAuthorizationHeader(accessToken),
  };

  try {
    const response = await fetch(`${baseUrl}/api/v1/agent/session/${sessionId}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.message || DEFAULT_ERROR_MESSAGE);
    }

    return data;
  } catch (error) {
    console.error("단일 세션 삭제 실패:", error);
    throw error;
  }
}

/**
 * 여러 세션을 일괄 삭제한다
 * DELETE /api/v1/agent/sessions
 */
export async function deleteSessions(sessionIds, accessToken) {
  const baseUrl = getBackendUrl();
  const headers = {
    "Content-Type": "application/json",
    Authorization: buildAuthorizationHeader(accessToken),
  };

  try {
    const response = await fetch(`${baseUrl}/api/v1/agent/sessions`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ session_ids: sessionIds }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.message || DEFAULT_ERROR_MESSAGE);
    }

    return data;
  } catch (error) {
    console.error("일괄 세션 삭제 실패:", error);
    throw error;
  }
}
