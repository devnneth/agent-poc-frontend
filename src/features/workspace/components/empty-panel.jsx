import { useTranslation } from 'react-i18next'

// 빈 상태 화면을 공통 렌더링
function EmptyPanel({ title }) {
  const { t } = useTranslation()
  return (
    <section className="flex h-full flex-col items-center justify-center text-center">
      <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50/70 px-10 py-12 dark:border-stone-800 dark:bg-stone-900/70">
        <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
          {title}
        </h2>
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
          {t('common.preparing')}
        </p>
      </div>
    </section>
  )
}

export { EmptyPanel }
