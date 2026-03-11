import { useTranslation } from 'react-i18next'
import { BaseModal } from '@/components/ui/base-modal'
import { getHitlSlots } from '../lib/hitl-slots'

// 날짜 문자열인지 확인
const isIsoDateString = (val) => {
  return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)
}

// 키 포맷 (snake_case -> Title Case 또는 친숙한 이름 번역)
const formatKey = (key) => {
  return key.replace(/_/g, ' ')
}

// HITL(Human-In-The-Loop) 승인 여부를 묻는 모달
function HitlModal({ request, open, onApprove, onReject }) {
  const { t, i18n } = useTranslation()

  if (!open || !request) return null

  // request.content 에 표시할 내용이 포함됨
  const content = request.content || ''
  const metadata = request.metadata || {}
  const slots = getHitlSlots(metadata)
  const hasSlots = Object.keys(slots).length > 0

  const formatValue = (val) => {
    if (isIsoDateString(val)) {
      const date = new Date(val);
      if (!Number.isNaN(date.getTime())) {
        const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US'
        return date.toLocaleString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
    return String(val)
  }

  return (
    <BaseModal
      open={open}
      onClose={undefined}
      ariaLabel={t('chat.hitl_modal_title')}
      closeOnBackdrop={false}
    >
      <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white p-8 shadow-xl dark:bg-stone-900">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-500 dark:text-cyan-400">
          {t('chat.hitl_approval')}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-stone-900 dark:text-stone-100">
          {content || t('chat.hitl_question')}
        </h2>

        {hasSlots ? (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-stone-50 p-5 dark:bg-stone-950/50">
            {Object.entries(slots).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                  {formatKey(key)}
                </span>
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {formatValue(value)}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 disabled:opacity-50"
          >
            {t('chat.hitl_reject')}
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="flex-1 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 dark:hover:bg-cyan-400 disabled:opacity-50"
          >
            {t('chat.hitl_approve')}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

export { HitlModal }
