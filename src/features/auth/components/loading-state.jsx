import { AuthShell } from './auth-shell'

// 세션 확인 중 표시되는 로딩 화면
function LoadingState() {
  return (
    <AuthShell>
      <div className="text-sm font-semibold text-stone-600 dark:text-stone-300">
        세션 확인 중...
      </div>
    </AuthShell>
  )
}

export { LoadingState }
