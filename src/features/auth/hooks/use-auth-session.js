import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../api/supabase'

// Supabase 세션 상태를 조회하고 구독하는 훅
function useAuthSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const historyLockHandlerRef = useRef(null)

  useEffect(() => {
    let mounted = true

    // 세션 상태를 안전하게 반영
    const applySession = (nextSession) => {
      if (!mounted) return
      setSession(nextSession)
    }

    // 초기 세션 조회
    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error) {
        console.error('세션 조회 실패:', error.message)
        applySession(null)
        setLoading(false)
        return
      }

      let sessionObj = data?.session ?? null;

      if (sessionObj) {
        // provider_token 보존 로직
        if (sessionObj.provider_token) {
          localStorage.setItem('gplanner_provider_token', sessionObj.provider_token);
        } else {
          const savedToken = localStorage.getItem('gplanner_provider_token');
          if (savedToken) {
            sessionObj = { ...sessionObj, provider_token: savedToken };
          }
        }

        // 구글 리프레시 토큰이 포함된 경우 (초기 세션 조회 시) localStorage에 보관
        if (sessionObj.provider_refresh_token) {
          localStorage.setItem('gplanner_google_refresh_token', sessionObj.provider_refresh_token);
        }
      } else {
        localStorage.removeItem('gplanner_provider_token');
        localStorage.removeItem('gplanner_google_refresh_token');
      }

      applySession(sessionObj);
      setLoading(false);
    }

    syncSession()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      let sessionObj = nextSession ?? null;
      if (sessionObj) {
        if (sessionObj.provider_token) {
          localStorage.setItem('gplanner_provider_token', sessionObj.provider_token);
        } else {
          const savedToken = localStorage.getItem('gplanner_provider_token');
          if (savedToken) {
            sessionObj = { ...sessionObj, provider_token: savedToken };
          }
        }

        // 구글 리프레시 토큰이 포함된 경우 (최초 로그인 시) localStorage에 보관
        if (sessionObj.provider_refresh_token) {
          localStorage.setItem('gplanner_google_refresh_token', sessionObj.provider_refresh_token);
        }
      } else {
        localStorage.removeItem('gplanner_provider_token');
        localStorage.removeItem('gplanner_google_refresh_token');
      }
      applySession(sessionObj);
      // onAuthStateChange가 syncSession보다 먼저 응답하는 경우에도
      // loading을 해제하여 로그인 레이어가 불필요하게 노출되지 않도록 처리
      setLoading(false);
    })

    return () => {
      mounted = false
      data?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      if (historyLockHandlerRef.current) {
        window.removeEventListener('popstate', historyLockHandlerRef.current)
        historyLockHandlerRef.current = null
      }
      return
    }

    // 로그인 완료 시 뒤로가기를 막기 위해 히스토리를 고정
    const handlePopState = () => {
      window.history.pushState(null, document.title, window.location.href)
    }

    window.history.replaceState(null, document.title, window.location.href)
    window.history.pushState(null, document.title, window.location.href)
    window.addEventListener('popstate', handlePopState)
    historyLockHandlerRef.current = handlePopState

    return () => {
      window.removeEventListener('popstate', handlePopState)
      historyLockHandlerRef.current = null
    }
  }, [session])

  return { session, loading }
}

export { useAuthSession }
