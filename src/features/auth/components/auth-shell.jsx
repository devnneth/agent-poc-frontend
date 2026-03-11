import { Card } from '@/components/ui/card'

// 인증 화면의 공통 배경/레이아웃 래퍼
function AuthShell({ children, card = false }) {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50 flex items-center justify-center px-6 dark:from-stone-950 dark:via-stone-900 dark:to-emerald-950">
      {card ? (
        <Card className="w-full max-w-md p-8 border-stone-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/80">
          {children}
        </Card>
      ) : (
        children
      )}
    </main>
  )
}

export { AuthShell }
