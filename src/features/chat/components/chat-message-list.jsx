import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MarkdownRenderer } from './markdown-renderer'

// 상태 메시지(Thinking/Tool)를 표시하고 나타날 때 페이드 인, 사라질 때 페이드 아웃 효과를 준다
function MessageStatus({ status, isCompleted }) {
  const [displayStatus, setDisplayStatus] = useState(status)
  const [isVisible, setIsVisible] = useState(!!status)
  const [prevStatus, setPrevStatus] = useState(status)

  // Props 변경에 따른 상태 조정을 렌더링 단계에서 수행
  if (status !== prevStatus) {
    setPrevStatus(status)
    if (status) {
      setDisplayStatus(status)
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  useEffect(() => {
    if (!isVisible && displayStatus) {
      const timer = setTimeout(() => {
        setDisplayStatus('')
      }, 500) // transition-all duration-500과 일치
      return () => clearTimeout(timer)
    }
  }, [isVisible, displayStatus])

  // 페이드 아웃이 완전히 끝날 때까지는 null을 반환하지 않음
  if (!displayStatus && !isVisible) return null

  // 이미 완료된 메시지이고 페이드 아웃도 끝났다면 렌더링 안 함
  if (isCompleted && !isVisible && !displayStatus) return null

  const translatedStatus = displayStatus || ''

  return (
    <div
      className={`
        overflow-hidden transition-all duration-500 ease-in-out
        ${isVisible ? 'max-h-10 opacity-100 mb-2' : 'max-h-0 opacity-0 mb-0'}
      `}
    >
      <div className="flex items-center gap-2 text-xs text-stone-500 animate-fast-pulse">
        <span className={`h-2 w-2 rounded-full ${translatedStatus.includes('도구') || translatedStatus.includes('tool') || translatedStatus.includes('Using') ? 'bg-amber-500' : 'bg-sky-500'}`} />
        {translatedStatus}
      </div>
    </div>
  )
}

// 응답 대기 상태를 표현하는 스피너를 그린다
function ChatMessageSpinner() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600 dark:border-stone-600 dark:border-t-stone-100" />
      <span className="text-xs text-stone-400 dark:text-stone-500">
        {t('chat.awaiting_response')}
      </span>
    </div>
  )
}

// 메시지 목록을 렌더링하는 컴포넌트
function ChatMessageList({ messages }) {
  const { t, i18n } = useTranslation()

  // 날짜를 로케일에 맞춰 변환한다
  const formatTimestamp = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US'
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '.')
  }

  const displayMessages = messages.filter(m => !m.isHidden)

  if (!displayMessages.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/70">
        <p className="text-sm text-stone-400 dark:text-stone-500">
          {t('chat.no_messages')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayMessages.map((message) => {
        const isUser = message.role === 'user'
        const hasContent = Boolean(message.content?.trim().length)
        const isAwaitingResponse = !isUser && !hasContent && !message.isCompleted
        const timestamp = formatTimestamp(message.createdAt)
        return (
          <div
            key={message.id}
            className={
              'flex w-full ' + (isUser ? 'justify-end' : 'justify-start')
            }
          >
            <div
              className={
                'flex max-w-[75%] flex-col ' +
                (isUser ? 'items-end' : 'items-start')
              }
            >
              {timestamp ? (
                <p className="mb-2 text-[11px] text-stone-400 dark:text-stone-500">
                  {timestamp}
                </p>
              ) : null}
              <div
                className={
                  'rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-300 ' +
                  (isUser
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'bg-white text-stone-700 dark:bg-stone-900 dark:text-stone-100')
                }
              >
                {isAwaitingResponse ? (
                  <ChatMessageSpinner />
                ) : isUser ? (
                  <div className="flex flex-col items-end gap-1">
                    {message.intent ? (
                      <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-stone-400 dark:bg-stone-100 dark:text-stone-500">
                        {message.intent}
                      </span>
                    ) : null}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ) : (
                  <>
                    {/* 상태 메시지(Thinking/Tool) - 페이드아웃 적용 */}
                    <MessageStatus
                      status={message.ephemeralStatus}
                      isCompleted={message.isCompleted}
                    />

                    {/* 본문 렌더링 */}
                    {hasContent ? (
                      <div className="flex flex-col gap-1 -mt-[2px]">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    ) : isAwaitingResponse ? <ChatMessageSpinner /> : (
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        {t('chat.no_content')}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { ChatMessageList }
