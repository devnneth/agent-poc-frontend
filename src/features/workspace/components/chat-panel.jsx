import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '../../../components/ui/confirm-modal'
import { ChatHome } from '../../chat/components/chat-home'
import { ChatScreen } from '../../chat/screens/chat-screen'
import { HitlModal } from '../../chat/components/hitl-modal'
import { HitlUpdateModal } from '../../chat/components/hitl-update-modal'
import { useChat } from '../../chat/hooks/use-chat'
import { getHitlSlots } from '../../chat/lib/hitl-slots'
import { checkRequiredSettings, loadCalendarPreferences } from '../../../repositories/preference-repository'

const buildRejectPayload = (request) => {
  const original = { ...getHitlSlots(request?.metadata) }

  for (const field of request?.metadata?.fields ?? []) {
    original[field.key] = field.value
  }

  return JSON.stringify({ ...original, user_confirmed: "reject" })
}

// 채팅 세션과 메시지 상태를 관리하는 패널
function ChatPanel({ onLockedAction, locked, session, onPendingStateChange }) {
  const { t } = useTranslation()
  const settingsValid = checkRequiredSettings()
  // 설정이 완료된 경우에만 컨텍스트를 로드 (미완료 시 빈 객체)
  const calendarContext = settingsValid ? loadCalendarPreferences() : {}

  const {
    sessions,
    activeSession,
    activeMessages,
    sending,
    errorMessage,
    isDeleting,
    deleteTarget,
    setDeleteTarget,
    handleStartSession,
    handleSendInSession,
    handleSelectSession,
    handleDeleteSession,
    handleCancelStream,
    handleBackToHome,
    deleteAllRequest,
    hitlRequest,
    setHitlRequest,
    handleDeleteAllRequest,
    handleCancelDeleteAll,
    handleConfirmDeleteAll,
  } = useChat(session, { locked, onLockedAction, calendarContext })

  useEffect(() => {
    onPendingStateChange?.(sending)
    return () => onPendingStateChange?.(false)
  }, [sending, onPendingStateChange])

  if (!activeSession) {
    return (
      <>
        <ChatHome
          sessions={sessions}
          onStartSession={handleStartSession}
          onSelectSession={handleSelectSession}
          onDeleteRequest={setDeleteTarget}
          onDeleteAllRequest={handleDeleteAllRequest}
          onCancelMessage={handleCancelStream}
          sending={sending}
          isDeleting={isDeleting}
          locked={locked}
          onLockedAction={onLockedAction}
        />
        <ConfirmModal
          open={Boolean(deleteTarget)}
          title={t('chat.delete_one_title')}
          description={t('chat.delete_one_desc')}
          confirmLabel={isDeleting ? t('chat.deleting') : t('common.delete')}
          cancelLabel={t('common.cancel')}
          onConfirm={handleDeleteSession}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          loading={isDeleting}
        />
        <ConfirmModal
          open={deleteAllRequest}
          title={t('chat.delete_all_title')}
          description={t('chat.delete_all_desc')}
          confirmLabel={isDeleting ? t('chat.deleting') : t('common.delete')}
          cancelLabel={t('common.cancel')}
          onConfirm={handleConfirmDeleteAll}
          onCancel={handleCancelDeleteAll}
          loading={isDeleting}
        />
        {hitlRequest?.metadata?.action === 'update' ? (
          <HitlUpdateModal
            open={!!hitlRequest}
            request={hitlRequest}
            onConfirm={(values) => {
              const payload = JSON.stringify({ ...values, user_confirmed: "approve" })
              handleStartSession(payload, {
                hidden: true, background: false,
                injectMessage: t('chat.hitl_update_confirmed_msg'),
                force: true
              })
              setHitlRequest(null)
            }}
            onCancel={() => {
              const payload = buildRejectPayload(hitlRequest)
              handleStartSession(payload, {
                hidden: true, background: false,
                injectMessage: t('chat.hitl_rejected_msg'),
                force: true
              })
              setHitlRequest(null)
            }}
          />
        ) : (
          <HitlModal
            open={!!hitlRequest}
            request={hitlRequest}
            onApprove={() => {
              handleStartSession("approve", { hidden: true, background: false, injectMessage: t('chat.hitl_approved_msg'), force: true })
              setHitlRequest(null)
            }}
            onReject={() => {
              handleStartSession("reject", { hidden: true, background: false, injectMessage: t('chat.hitl_rejected_msg'), force: true })
              setHitlRequest(null)
            }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <ChatScreen
        session={activeSession}
        messages={activeMessages}
        onBack={handleBackToHome}
        onSendMessage={handleSendInSession}
        onCancelMessage={handleCancelStream}
        sending={sending}
        errorMessage={errorMessage}
        locked={locked}
        onLockedAction={onLockedAction}
      />
      {hitlRequest?.metadata?.action === 'update' ? (
        <HitlUpdateModal
          open={!!hitlRequest}
          request={hitlRequest}
          onConfirm={(values) => {
            const payload = JSON.stringify({ ...values, user_confirmed: "approve" })
            handleSendInSession(payload, {
              hidden: true, background: false,
              injectMessage: t('chat.hitl_update_confirmed_msg'),
              force: true
            })
            setHitlRequest(null)
          }}
          onCancel={() => {
            const payload = buildRejectPayload(hitlRequest)
            handleSendInSession(payload, {
              hidden: true, background: false,
              injectMessage: t('chat.hitl_rejected_msg'),
              force: true
            })
            setHitlRequest(null)
          }}
        />
      ) : (
        <HitlModal
          open={!!hitlRequest}
          request={hitlRequest}
          onApprove={() => {
            handleSendInSession("approve", { hidden: true, background: false, injectMessage: t('chat.hitl_approved_msg'), force: true })
            setHitlRequest(null)
          }}
          onReject={() => {
            handleSendInSession("reject", { hidden: true, background: false, injectMessage: t('chat.hitl_rejected_msg'), force: true })
            setHitlRequest(null)
          }}
        />
      )}
    </>
  )
}

export { ChatPanel }
