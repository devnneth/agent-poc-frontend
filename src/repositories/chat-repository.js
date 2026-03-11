const SESSION_STORAGE_KEY = 'gplanner.chat.sessions'
const MESSAGE_STORAGE_KEY = 'gplanner.chat.messages'

// 로컬 저장소에서 JSON 데이터를 안전하게 읽어온다
function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch (error) {
    console.error('채팅 저장소 읽기 실패:', error)
    return fallback
  }
}

// 로컬 저장소에 JSON 데이터를 안전하게 저장한다
function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('채팅 저장소 저장 실패:', error)
  }
}

// 저장된 세션 목록을 불러온다
function loadSessions() {
  return readStorage(SESSION_STORAGE_KEY, [])
}

// 세션 목록을 저장한다
function saveSessions(sessions) {
  writeStorage(SESSION_STORAGE_KEY, sessions)
}

// 저장된 메시지 목록을 불러온다
function loadMessages() {
  return readStorage(MESSAGE_STORAGE_KEY, [])
}

// 메시지 목록을 저장한다
function saveMessages(messages) {
  writeStorage(MESSAGE_STORAGE_KEY, messages)
}

// 세션을 추가 저장한다
function appendSession(session) {
  const sessions = loadSessions()
  const nextSessions = [session, ...sessions]
  saveSessions(nextSessions)
  return nextSessions
}

// 메시지를 추가 저장한다
function appendMessage(message) {
  const messages = loadMessages()
  const nextMessages = [...messages, message]
  saveMessages(nextMessages)
  return nextMessages
}

// 특정 세션의 메시지를 필터링한다
function getMessagesBySession(sessionId) {
  const messages = loadMessages()
  return messages.filter((message) => message.sessionId === sessionId)
}

/**
 * 로컬 저장소에서 세션들과 관련 메시지들을 제거한다
 * @param {string[]} sessionIds 삭제할 세션 ID 배열
 */
function removeSessionsLocally(sessionIds) {
  const sessions = loadSessions()
  const messages = loadMessages()

  const nextSessions = sessions.filter((s) => !sessionIds.includes(s.id))
  const nextMessages = messages.filter((m) => !sessionIds.includes(m.sessionId))

  saveSessions(nextSessions)
  saveMessages(nextMessages)

  return { sessions: nextSessions, messages: nextMessages }
}

export {
  loadSessions,
  saveSessions,
  loadMessages,
  saveMessages,
  appendSession,
  appendMessage,
  getMessagesBySession,
  removeSessionsLocally,
}
