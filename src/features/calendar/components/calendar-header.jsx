import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Copy } from 'lucide-react'
import { format, getWeek } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'

export function CalendarHeader({
  currentDate,
  viewMode,
  onPrev,
  onNext,
  onToday,
  onMonthView,
  onWeekView,
  onCopyContext,
  authRequired,
  onConnect,
  loading,
  isBackendOnline
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ko' ? ko : enUS

  const year = format(currentDate, 'yyyy')
  const month = format(currentDate, i18n.language === 'ko' ? 'M' : 'MMMM', { locale })
  const week = getWeek(currentDate)

  const title =
    viewMode === 'week'
      ? t('calendar.week_format', { year, month, week })
      : t('calendar.month_format', { year, month })

  return (
    <div className="mb-4 flex items-center justify-between px-1">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          {title}
        </h1>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-full p-1 text-stone-500 transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
            aria-label={t('calendar.prev')}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-full p-1 text-stone-500 transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
            aria-label={t('calendar.next')}
          >
            <ChevronRight size={20} />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="ml-1 flex items-center rounded-md px-2 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <CalendarDays size={16} className="mr-1" />
            {t('calendar.today')}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-md p-2 text-stone-500 transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
          onClick={onCopyContext}
          aria-label={t('calendar.copy_aria')}
          title={t('calendar.copy_aria')}
        >
          <Copy size={18} />
        </button>

        {viewMode === 'week' ? (
          <button
            type="button"
            className="flex items-center gap-2 rounded-md p-2 text-stone-500 transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
            onClick={onMonthView}
          >
            <Calendar size={18} />
            <span className="text-sm font-medium">{t('calendar.month_view')}</span>
          </button>
        ) : (
          <button
            type="button"
            className="flex items-center gap-2 rounded-md p-2 text-stone-500 transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
            onClick={onWeekView}
          >
            <Calendar size={18} />
            <span className="text-sm font-medium">{t('calendar.week_view')}</span>
          </button>
        )}

        {authRequired && (
          <button
            type="button"
            onClick={onConnect}
            disabled={loading || isBackendOnline === false}
            className="group flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition-all hover:bg-stone-50 hover:shadow-md active:scale-95 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            {loading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-stone-400 border-t-stone-600" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {t('calendar.connect_google_calendar')}
          </button>
        )}
      </div>
    </div>
  )
}

