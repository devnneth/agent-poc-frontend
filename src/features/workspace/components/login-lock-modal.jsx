import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GoogleLoginButton } from '../../auth/components/google-login-button'
import { EmailLoginButton } from '../../auth/components/email-login-button'
import { EmailLoginForm } from '../../auth/components/email-login-form'
import { useAuthActions } from '../../auth/hooks/use-auth-actions'
import { authService } from '../../../services/auth-service'
import { BackendStatusIndicator } from '@/components/ui/backend-status-indicator'

// 환경 변수로 Google 로그인 숨김 여부를 결정합니다.
const HIDE_GOOGLE_LOGIN = import.meta.env.VITE_HIDE_GOOGLE_LOGIN === 'true';

// 비로그인 상태에서 안내를 띄우는 모달
function LoginLockModal({ open, locked, onClose }) {
  const { t } = useTranslation()
  const [isBackendOnline, setIsBackendOnline] = useState(null)
  const [loginMode, setLoginMode] = useState('select') // 'select', 'email'
  const { handleGoogleLogin, handleEmailLogin } = useAuthActions()

  useEffect(() => {
    if (open) {
      const checkHealth = async () => {
        const isOnline = await authService.checkBackendHealth()
        setIsBackendOnline(isOnline)
      }
      checkHealth()

      const intervalId = setInterval(checkHealth, 5000)

      return () => clearInterval(intervalId)
    }
  }, [open])

  if (!open) return null

  const handleBackdropClick = () => {
    if (locked) return
    onClose?.()
  }

  const backendStatusMessage = isBackendOnline === null
    ? t('auth.backend_checking')
    : isBackendOnline
      ? t('auth.backend_online')
      : t('auth.backend_offline')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl dark:bg-stone-900 transition-all duration-300 ${loginMode === 'email' ? 'max-h-[90vh] overflow-y-auto' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500">
          {t('auth.login_btn')}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-stone-900 dark:text-stone-100">
          {t('auth.login_required')}
        </h2>
        <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
          {t('auth.login_desc')}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 min-h-[120px]">
          {loginMode === 'select' ? (
            <>
              {!HIDE_GOOGLE_LOGIN && (
                <GoogleLoginButton onClick={handleGoogleLogin} disabled={isBackendOnline !== true} />
              )}
              <div className="w-full max-w-sm">
                <EmailLoginButton 
                onClick={() => setLoginMode('email')} 
                disabled={isBackendOnline !== true} 
                />
                <p className={`mt-3 text-center text-xs font-medium ${isBackendOnline ? 'text-emerald-600 dark:text-emerald-400' : isBackendOnline === false ? 'hidden' : 'text-stone-500 dark:text-stone-400'}`}>
                  {backendStatusMessage}
                </p>
              </div>
            </>
          ) : (
            <EmailLoginForm 
              onLogin={handleEmailLogin} 
              onBack={() => setLoginMode('select')}
              disabled={isBackendOnline !== true}
              backendStatusMessage={backendStatusMessage}
              isBackendOnline={isBackendOnline}
            />
          )}
        </div>

        {isBackendOnline === false && (
          <div className="mt-6">
            <BackendStatusIndicator />
          </div>
        )}
        {locked ? null : (
          <button
            type="button"
            onClick={onClose}
            className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400 transition hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
          >
            {t('common.close')}
          </button>
        )}
      </div>
    </div>
  )
}

export { LoginLockModal }
