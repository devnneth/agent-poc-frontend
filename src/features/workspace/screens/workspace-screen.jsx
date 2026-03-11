import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { workspaceTabLabels, workspaceTabs } from '../../../lib/constants'
import { Sidebar } from '../components/sidebar'
import { ChatPanel } from '../components/chat-panel'
import { EmptyPanel } from '../components/empty-panel'
import { LoginLockModal } from '../components/login-lock-modal'
import { CalendarScreen } from '../../calendar/screens/calendar-screen'
import { CalendarSettingsScreen } from '../../settings/screens/calendar-settings-screen'
import { TodoScreen } from '../../todos/screens/todo-screen'
import { MemoScreen } from '../../memos/screens/memo-screen'
import { useWorkspace } from '../hooks/use-workspace'
import { BackendStatusIndicator } from '../../../components/ui/backend-status-indicator'

// 좌측 메뉴와 우측 패널을 구성하는 메인 화면
function WorkspaceScreen({ session, theme, onToggleTheme }) {
  const { t } = useTranslation()
  const [chatWaitingForResponse, setChatWaitingForResponse] = useState(false)
  const canLeaveChat = useCallback(() => {
    if (!chatWaitingForResponse) return true
    return window.confirm(t('chat.leave_while_waiting'))
  }, [chatWaitingForResponse, t])
  const {
    activeTab,
    loginModalOpen,
    loggingOut,
    chatHomeRequestId,
    locked,
    handleTabSelect,
    handleLogout,
    closeLoginModal,
    openLoginModal,
    isSidebarCollapsed,
    toggleSidebar,
    isBackendOnline
  } = useWorkspace(session, { canLeaveChat })

  let mainContent = null
  if (activeTab === 'schedule') {
    mainContent = <CalendarScreen />
  } else if (activeTab === 'todo') {
    mainContent = <TodoScreen />
  } else if (activeTab === 'memo') {
    mainContent = <MemoScreen />
  } else if (activeTab === 'settings') {
    mainContent = <CalendarSettingsScreen />
  } else if (activeTab !== 'chat') {
    mainContent = <EmptyPanel title={t(workspaceTabLabels[activeTab])} />
  }

  const isFullWidth = activeTab === 'schedule' || activeTab === 'settings'

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 dark:bg-stone-950">
      <Sidebar
        tabs={workspaceTabs}
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        chatWaitingForResponse={chatWaitingForResponse}
        theme={theme}
        onToggleTheme={onToggleTheme}
        collapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />
      <main
        className={`flex-1 relative ${isFullWidth ? 'overflow-hidden' : 'overflow-y-auto px-10 py-10'}`}
        onClick={locked ? openLoginModal : undefined}
      >
        <div className={`mx-auto flex h-full min-h-0 flex-col ${isFullWidth ? '' : 'max-w-4xl'}`}>
          <div className={activeTab === 'chat' ? 'flex h-full min-h-0 flex-col' : 'hidden'}>
            <ChatPanel
              key={`chat-panel-${chatHomeRequestId}`}
              locked={locked}
              onLockedAction={openLoginModal}
              session={session}
              onPendingStateChange={setChatWaitingForResponse}
            />
          </div>
          {mainContent}
        </div>
        {isBackendOnline === false && !locked && (
          <div className="absolute top-4 right-4 z-50 rounded-full bg-white dark:bg-stone-800 px-4 py-2 shadow-md">
            <BackendStatusIndicator />
          </div>
        )}
      </main>


      <LoginLockModal
        key={locked || loginModalOpen ? 'auth-modal-open' : 'auth-modal-closed'}
        open={locked || loginModalOpen}
        locked={locked}
        onClose={closeLoginModal}
      />
    </div>
  )
}


export { WorkspaceScreen }
