import { useTranslation } from 'react-i18next'
import { BaseModal } from './base-modal'

// 확인 모달을 공용으로 제공한다
function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const { t } = useTranslation()
  const finalConfirmLabel = confirmLabel || t('common.confirm')
  const finalCancelLabel = cancelLabel || t('common.cancel')

  return (
    <BaseModal open={open} onClose={onCancel} ariaLabel={title} closeOnBackdrop={!loading}>
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl dark:bg-stone-900">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500">
          Confirm
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-stone-900 dark:text-stone-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 dark:hover:bg-rose-400 ${loading ? 'cursor-not-allowed opacity-50' : ''
              }`}
          >
            {finalConfirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`rounded-2xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-600 transition hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:text-stone-100 ${loading ? 'cursor-not-allowed opacity-50' : ''
              }`}
          >
            {finalCancelLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

export { ConfirmModal }
