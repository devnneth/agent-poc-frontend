import { useAuthSession } from '../features/auth/hooks/use-auth-session'
import { LoadingState } from '../features/auth/components/loading-state'
import { WorkspaceScreen } from '../features/workspace/screens/workspace-screen'
import { useTheme } from '../hooks/use-theme'
import { Toaster } from '../components/ui/toaster'
import './app.css'

// 세션 상태에 따라 화면을 분기하는 최상위 컴포넌트
function App() {
  const { session, loading } = useAuthSession()
  const { theme, toggleTheme } = useTheme()

  if (loading) {
    return <LoadingState />
  }

  return (
    <>
      <WorkspaceScreen
        session={session}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <Toaster />
    </>
  )
}

export default App
