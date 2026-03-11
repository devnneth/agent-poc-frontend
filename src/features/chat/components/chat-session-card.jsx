import { useTranslation } from 'react-i18next'

// 세션 카드 UI를 분리하여 재사용한다
function ChatSessionCard({
  session,
  active = false,
  onSelect,
  onDelete,
  isDeleting = false,
}) {
  const { t, i18n } = useTranslation()

  // 업데이트 시간을 보기 좋게 변환한다
  const formatTimestamp = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    // 현재 설정된 언어(ko 또는 en)에 맞춰 날짜 형식을 변환한다
    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US'
    return date.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={
        'flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ' +
        (active
          ? 'border-stone-800 bg-stone-900 text-white dark:border-stone-200 dark:bg-stone-100 dark:text-stone-900'
          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:hover:border-stone-600')
      }
    >
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => onSelect?.(session.id)}
        className="flex flex-1 items-start justify-between gap-3 text-left disabled:opacity-50"
      >
        <div>
          <p className="text-sm font-semibold">{session.title || t('chat.new_session')}</p>
          <p
            className={
              'mt-1 text-xs ' +
              (active
                ? 'text-stone-200 dark:text-stone-600'
                : 'text-stone-400 dark:text-stone-500')
            }
          >
            {formatTimestamp(session.updatedAt || session.createdAt)}
          </p>
        </div>
      </button>

      <button
        type="button"
        aria-label={t('chat.delete_session_aria')}
        disabled={isDeleting}
        onClick={(event) => {
          event.stopPropagation()
          onDelete?.(session)
        }}
        className={
          'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition disabled:opacity-30 ' +
          (active
            ? 'border-stone-700 text-stone-200 hover:border-rose-300 hover:text-rose-300 dark:border-stone-400 dark:text-stone-600 dark:hover:border-rose-300 dark:hover:text-rose-300'
            : 'border-stone-200 text-stone-400 hover:border-rose-200 hover:text-rose-500 dark:border-stone-700 dark:text-stone-500 dark:hover:border-rose-300 dark:hover:text-rose-300')
        }
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
          <path d="M6 6l1 14h10l1-14" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  )
}

export { ChatSessionCard }
