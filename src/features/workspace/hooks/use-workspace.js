import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../api/supabase'
import { authService } from '../../../services/auth-service'
import { useGoogleCalendar } from '../../calendar/hooks/use-google-calendar'

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'gplanner.sidebar.collapsed'
const TAB_PARAM_KEY = 'tab'

function loadSidebarCollapsedPreference() {
    try {
        return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
    } catch (error) {
        console.error('사이드바 상태 읽기 실패:', error)
        return false
    }
}

function loadTabFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search)
        return params.get(TAB_PARAM_KEY) || 'chat'
    } catch (error) {
        console.error('URL 탭 상태 읽기 실패:', error)
        return 'chat'
    }
}

/**
 * 워크스페이스 상태 및 탭 전환, 인증 관련 로직을 관리하는 커스텀 훅
 */
export function useWorkspace(session, { canLeaveChat } = {}) {
    const [activeTab, setActiveTab] = useState(loadTabFromUrl)
    const [loginModalOpen, setLoginModalOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [chatHomeRequestId, setChatHomeRequestId] = useState(0)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(loadSidebarCollapsedPreference)
    const [isBackendOnline, setIsBackendOnline] = useState(true)

    const { authRequired, requestAuthorization, loading: calendarLoading } = useGoogleCalendar()

    const locked = !session
    const resolvedActiveTab = locked ? 'chat' : activeTab

    const updateUrlTab = useCallback((tab) => {
        const url = new URL(window.location.href)
        if (tab === 'chat') {
            url.searchParams.delete(TAB_PARAM_KEY)
        } else {
            url.searchParams.set(TAB_PARAM_KEY, tab)
        }
        window.history.pushState({}, '', url.toString())
    }, [])

    const openLoginModal = useCallback(() => {
        if (!locked) return
        setLoginModalOpen(true)
    }, [locked])

    const closeLoginModal = useCallback(() => {
        setLoginModalOpen(false)
    }, [])

    const handleTabSelect = useCallback((nextTab) => {
        if (locked) {
            openLoginModal()
            return
        }
        if (nextTab === 'chat' && activeTab === 'chat') {
            if (canLeaveChat && !canLeaveChat()) {
                return
            }
            setChatHomeRequestId((prev) => prev + 1)
        }
        setActiveTab(nextTab)
        updateUrlTab(nextTab)
    }, [locked, activeTab, openLoginModal, updateUrlTab, canLeaveChat])


    const handleLogout = useCallback(async () => {
        if (locked) {
            openLoginModal()
            return
        }
        if (loggingOut) return

        setLoggingOut(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('로그아웃 실패:', error.message)
            }
        } finally {
            setLoggingOut(false)
        }
    }, [locked, loggingOut, openLoginModal])

    const handleGoogleLogin = useCallback(async () => {
        const redirectTo = `${window.location.origin}/`
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })

        if (error) {
            console.error('구글 로그인 요청 실패:', error.message)
        }
    }, [])

    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed((prev) => !prev)
    }, [])

    useEffect(() => {
        try {
            window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isSidebarCollapsed))
        } catch (error) {
            console.error('사이드바 상태 저장 실패:', error)
        }
    }, [isSidebarCollapsed])

    // 브라우저 뒤로가기/앞으로가기 대응
    useEffect(() => {
        const handlePopState = () => {
            const tab = loadTabFromUrl()
            setActiveTab(tab)
        }
        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    useEffect(() => {
        let mounted = true
        const checkHealth = async () => {
            const isOnline = await authService.checkBackendHealth()
            if (mounted) setIsBackendOnline(isOnline)
        }
        checkHealth()
        const intervalId = setInterval(checkHealth, 5000)
        return () => {
            mounted = false
            clearInterval(intervalId)
        }
    }, [])

    return {
        activeTab: resolvedActiveTab,
        loginModalOpen,
        loggingOut,
        chatHomeRequestId,
        locked,
        isSidebarCollapsed,
        handleTabSelect,
        handleLogout,
        handleGoogleLogin,
        closeLoginModal,
        openLoginModal,
        toggleSidebar,
        isBackendOnline,
        authRequired,
        requestAuthorization,
        calendarLoading
    }
}
