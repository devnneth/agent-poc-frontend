import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatSessionCard } from './chat-session-card'

// 세션 목록을 렌더링하는 컴포넌트
function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteRequest,
  isDeleting = false,
  locked,
  onLockedAction,
}) {
  const { t } = useTranslation()
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        const left = new Date(a.updatedAt || a.createdAt).getTime()
        const right = new Date(b.updatedAt || b.createdAt).getTime()
        return right - left
      }),
    [sessions],
  )

  if (!sessions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center dark:border-stone-800 dark:bg-stone-900/70">
        <p className="text-sm text-stone-400 dark:text-stone-500">
          {t('chat.no_sessions')}
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-3 pb-6">
      {sortedSessions.map((session) => (
        <li key={session.id}>
          <ChatSessionCard
            session={session}
            active={session.id === activeSessionId}
            onSelect={(sessionId) => onSelectSession?.(sessionId)}
            onDelete={(target) => {
              if (locked) {
                onLockedAction?.()
                return
              }
              onDeleteRequest?.(target)
            }}
            isDeleting={isDeleting}
          />
        </li>
      ))}
    </ul>
  )
}

export { ChatSessionList }
