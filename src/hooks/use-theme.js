import { useEffect, useState } from 'react'
import { loadTheme, saveTheme } from '../repositories/preference-repository'

const THEME = {
  light: 'light',
  dark: 'dark',
}

// 브라우저 선호/저장값을 반영해 초기 테마를 결정한다
function resolveInitialTheme() {
  const stored = loadTheme()
  if (stored) return stored
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return THEME.dark
  }
  return THEME.light
}

// HTML 루트에 다크 클래스 적용을 토글한다
function applyThemeClass(theme) {
  if (!document?.documentElement) return
  document.documentElement.classList.toggle('dark', theme === THEME.dark)
}

// 테마 상태를 관리하고 저장소와 동기화한다
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const initialTheme = resolveInitialTheme()
    applyThemeClass(initialTheme)
    return initialTheme
  })

  useEffect(() => {
    applyThemeClass(theme)
    saveTheme(theme)
  }, [theme])

  // 라이트/다크 테마를 교차 토글한다
  const toggleTheme = () => {
    setTheme((prev) => (prev === THEME.dark ? THEME.light : THEME.dark))
  }

  return { theme, toggleTheme }
}

export { useTheme }
