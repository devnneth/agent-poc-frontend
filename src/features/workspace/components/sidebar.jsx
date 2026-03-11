import { MessageSquare, Calendar, CheckSquare, StickyNote, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MenuItem } from './menu-item'

const TAB_ICONS = {
  chat: MessageSquare,
  schedule: Calendar,
  todo: CheckSquare,
  memo: StickyNote,
}

// 좌측 사이드바 레이아웃과 메뉴를 렌더링
function Sidebar({
  tabs,
  activeTab,
  onSelectTab,
  onLogout,
  loggingOut,
  chatWaitingForResponse,
  theme,
  onToggleTheme,
  collapsed,
  onToggleSidebar
}) {
  const { t } = useTranslation()
  const navigationLocked = chatWaitingForResponse && activeTab === 'chat'

  return (
    <aside className={`flex h-full ${collapsed ? 'w-20 px-3' : 'w-72 px-6'} flex-col overflow-y-auto border-r border-stone-200 bg-white py-8 transition-all duration-300 dark:border-stone-800 dark:bg-stone-900`}>
      <div className="flex flex-col gap-4">
        <div className={`flex items-center ${collapsed ? 'flex-col gap-3 justify-center' : 'justify-between pl-1'}`}>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? t('sidebar.toggle_light') : t('sidebar.toggle_dark')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            {theme === 'dark' ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2.5v2.5" />
                <path d="M12 19v2.5" />
                <path d="M4.6 4.6l1.8 1.8" />
                <path d="M17.6 17.6l1.8 1.8" />
                <path d="M2.5 12h2.5" />
                <path d="M19 12h2.5" />
                <path d="M4.6 19.4l1.8-1.8" />
                <path d="M17.6 6.4l1.8-1.8" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={collapsed ? t('sidebar.expand_sidebar') : t('sidebar.collapse_sidebar')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-400 dark:text-stone-500">
              {t('sidebar.app_title')}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
              {t('sidebar.app_subtitle')}
            </h1>
          </div>
        )}
      </div>

      <nav className="mt-10 flex-1 space-y-2">
        {tabs.map((tab) => (
          <MenuItem
            key={tab.key}
            label={t(tab.label)}
            icon={TAB_ICONS[tab.key]}
            active={activeTab === tab.key}
            onClick={() => onSelectTab(tab.key)}
            disabled={navigationLocked && tab.key !== 'chat'}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className={`space-y-2 border-t border-stone-200 pt-6 dark:border-stone-800 ${collapsed ? 'px-0' : ''}`}>
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          disabled={navigationLocked}
          title={collapsed ? t('sidebar.settings_security') : undefined}
          className={`flex w-full items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} rounded-2xl border py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${activeTab === 'settings'
            ? 'bg-stone-900 border-stone-900 text-white dark:bg-stone-100 dark:border-stone-100 dark:text-stone-900'
            : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:text-stone-100'
            }`}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">{t('sidebar.settings_security')}</span>}
        </button>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut || navigationLocked}
          title={collapsed ? (loggingOut ? t('sidebar.logging_out') : t('sidebar.logout')) : undefined}
          className={`flex w-full items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} rounded-2xl border border-stone-200 py-3 text-left text-sm font-semibold text-stone-600 transition hover:border-stone-300 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:text-stone-100`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">{loggingOut ? t('sidebar.logging_out') : t('sidebar.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}

export { Sidebar }
