import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * 이메일과 비밀번호를 입력받아 로그인을 시도하는 폼 컴포넌트
 */
function EmailLoginForm({ onLogin, onBack, disabled }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('lastsky@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || loading || disabled) return

    setLoading(true)
    const success = await onLogin(email, password)
    if (!success) {
      setLoading(false)
    }
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-left">
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            disabled={loading || disabled}
            className="w-full rounded-xl border-none bg-stone-100 px-4 py-3 text-sm transition focus:ring-2 focus:ring-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-stone-700"
            required
          />
        </div>
        <div className="text-left">
          <label htmlFor="password" title={t('auth.password')} className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading || disabled}
            className="w-full rounded-xl border-none bg-stone-100 px-4 py-3 text-sm transition focus:ring-2 focus:ring-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:focus:ring-stone-700"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || disabled}
          className="w-full rounded-full bg-stone-900 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-stone-800 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          {loading ? t('common.loading') : t('auth.login_btn')}
        </button>
      </form>
      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="mt-6 text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors dark:text-stone-500 dark:hover:text-stone-300"
      >
        {t('auth.back_to_select')}
      </button>
    </div>
  )
}

export { EmailLoginForm }
