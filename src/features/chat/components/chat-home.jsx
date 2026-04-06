import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/ui/page-header'
import { ChatInput } from './chat-input'
import { ChatSessionList } from './chat-session-list'

// 채팅 홈 화면(입력창 + 세션 목록)을 구성한다
function ChatHome({
  sessions,
  onStartSession,
  onSelectSession,
  onDeleteRequest,
  onDeleteAllRequest,
  onCancelMessage,
  sending,
  isDeleting = false,
  locked,
  onLockedAction,
}) {
  const { t } = useTranslation()
  const presetsArr = t('chat.presets', { returnObjects: true })
  const presets = Array.isArray(presetsArr)
    ? presetsArr.map((prompt, index) => ({ id: `preset-${index}`, prompt }))
    : []

  return (
    <section className="flex h-full flex-col">
      <PageHeader
        category={t('sidebar.chat')}
        title={t('chat.home_title')}
        description={t('chat.home_desc')}
        className="border-b pb-6"
      />

      <ChatInput
        onSend={onStartSession}
        onCancel={onCancelMessage}
        sending={sending}
        locked={locked}
        onLockedAction={onLockedAction}
        placeholder={t('chat.first_msg_placeholder')}
        presets={presets}
      />

      <div className="mt-6 flex-1">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">
              {t('chat.sessions_title')}
            </p>
            <h3 className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-100">
              {t('chat.sessions_title')}
            </h3>
          </div>
          <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                if (locked) {
                  onLockedAction?.()
                  return
                }
                onDeleteAllRequest?.()
              }}
              className="group flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-stone-700 dark:text-stone-500 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 disabled:opacity-30"
              aria-label={t('chat.delete_all_aria')}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M5 21h14a2 2 0 002-2V6H3v13a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          </div>
        </div>
        <ChatSessionList
          sessions={sessions}
          onSelectSession={onSelectSession}
          onDeleteRequest={onDeleteRequest}
          isDeleting={isDeleting}
          locked={locked}
          onLockedAction={onLockedAction}
        />
      </div>
    </section>
  )
}

export { ChatHome }
