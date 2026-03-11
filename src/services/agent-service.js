import { deleteSession, deleteSessions } from "../api/agent/agent-api";
import { removeSessionsLocally } from "../repositories/chat-repository";

/**
 * 특정 채팅 세션을 삭제한다 (백엔드 및 로컬 저장소 동기화)
 */
export async function deleteChatSession(sessionId, accessToken) {
  try {
    // 1. 백엔드 세션 삭제 (LangGraph 체크포인트 등 정리)
    await deleteSession(sessionId, accessToken);

    // 2. 로컬 저장소에서 세션 및 메시지 제거
    return removeSessionsLocally([sessionId]);
  } catch (error) {
    console.error("채팅 세션 삭제 서비스 오류:", error);
    throw error;
  }
}

/**
 * 선택된 여러 채팅 세션을 일괄 삭제한다
 */
export async function deleteChatSessions(sessionIds, accessToken) {
  if (!sessionIds || sessionIds.length === 0) return null;

  try {
    // 1. 백엔드 일괄 삭제
    await deleteSessions(sessionIds, accessToken);

    // 2. 로컬 저장소 동기화
    return removeSessionsLocally(sessionIds);
  } catch (error) {
    console.error("채팅 세션 일괄 삭제 서비스 오류:", error);
    throw error;
  }
}
