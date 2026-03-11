import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

/**
 * 이메일 로그인 트리거 버튼
 * 구글 로그인 버튼과 동일한 레이아웃과 애니메이션을 가집니다.
 */
function EmailLoginButton({ onClick, disabled }) {
  const { t } = useTranslation()
  
  return (
    <Button
      variant="outline"
      size="lg"
      disabled={disabled}
      className="w-full max-w-sm rounded-full gap-3 py-6 shadow-xl text-stone-700 font-bold text-base relative hover:scale-[1.02] transition-all duration-300 border-stone-200 bg-white dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700"
      onClick={onClick}
    >
      <div className="bg-stone-100 dark:bg-stone-700 p-1.5 rounded-full flex items-center justify-center shrink-0 w-8 h-8 absolute left-2">
        <Mail className="w-4 h-4 text-stone-600 dark:text-stone-300" />
      </div>
      <span className="pl-6">{t('auth.login_with_email')}</span>
    </Button>
  )
}

export { EmailLoginButton }
