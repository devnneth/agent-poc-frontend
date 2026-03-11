import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { ChatInput } from '../components/chat-input'
import { ChatMessageList } from '../components/chat-message-list'
import { useToast } from '@/hooks/use-toast'

// 특정 세션의 대화 내용을 보여주는 화면
function ChatScreen({
  session,
  messages,
  onBack,
  onSendMessage,
  onCancelMessage,
  sending,
  errorMessage,
  locked,
  onLockedAction,
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const bottomRef = useRef(null)

  const handleCopyPayload = async () => {
    try {
      const payload = messages
        .map(m => m.rawLog)
        .filter(Boolean);

      const text = JSON.stringify(payload, null, 2);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast({
        title: t('chat.copy_success'),
        description: t('chat.copy_success_desc')
      });
    } catch (error) {
      console.error('Payload 복사 실패:', error);
      toast({
        variant: 'destructive',
        title: t('chat.copy_fail'),
        description: t('chat.copy_fail_desc')
      });
    }
  };

  // 메시지가 추가되거나 내용이 업데이트되면 스크롤을 항상 맨 아래로 이동한다
  useEffect(() => {
    if (!bottomRef.current) return
    bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages])

  return (
    <section className="flex h-full min-h-0 flex-col">
      <PageHeader
        category="Session"
        title={session?.title || t('chat.session_title_default')}
        className="border-b pb-6"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center justify-center rounded-md p-2 text-stone-500 transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
            onClick={handleCopyPayload}
            aria-label={t('chat.copy_payload_aria')}
            title={t('chat.copy_payload_aria')}
          >
            <Copy size={18} />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500"
          >
            {t('chat.back_to_list')}
          </button>
        </div>
      </PageHeader>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 flex-1 min-h-0 overflow-y-auto pr-2">
        <ChatMessageList messages={messages} />
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={onSendMessage}
        onCancel={onCancelMessage}
        sending={sending}
        locked={locked}
        onLockedAction={onLockedAction}
      />
    </section>
  )
}

export { ChatScreen }
