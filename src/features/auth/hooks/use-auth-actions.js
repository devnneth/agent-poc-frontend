import { useState, useCallback } from 'react'
import { supabase } from '../../../api/supabase'
import { authService } from '@/services/auth-service'
import { useToast } from '@/hooks/use-toast'
import { validatePassword } from '../../../lib/validators'
import { useTranslation } from 'react-i18next'

/**
 * 로그인 및 비밀번호 변경 관련 비즈니스 로직을 관리하는 커스텀 훅
 */
export function useAuthActions() {
    const { t } = useTranslation()
    const { toast } = useToast()
    const [updating, setUpdating] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    // 구글 OAuth 로그인 처리
    const handleGoogleLogin = useCallback(async () => {
        toast({
            title: t('auth.google_login_disabled_title'),
            description: t('auth.google_login_disabled_desc'),
        })
    }, [t, toast])

    // 비밀번호 업데이트 처리
    const handlePasswordUpdate = useCallback(async (password) => {
        if (updating) return false

        const validation = validatePassword(password)
        if (!validation.valid) {
            toast({
                variant: "destructive",
                title: "입력 오류",
                description: validation.message,
            })
            return false
        }

        setUpdating(true)
        const { error } = await authService.updatePassword(validation.value)
        setUpdating(false)

        if (error) {
            toast({
                variant: "destructive",
                title: "업데이트 실패",
                description: error.message,
            })
            return false
        }

        toast({
            title: "성공",
            description: "비밀번호가 변경되었습니다.",
        })
        return true
    }, [updating, toast])

    // 로그아웃 처리
    const handleLogout = useCallback(async () => {
        if (loggingOut) return

        setLoggingOut(true)
        const { error } = await supabase.auth.signOut()
        setLoggingOut(false)

        if (error) {
            toast({
                variant: "destructive",
                title: "로그아웃 실패",
                description: error.message,
            })
        }
    }, [loggingOut, toast])

    // 이메일/비밀번호 로그인 처리
    const handleEmailLogin = useCallback(async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('이메일 로그인 실패:', error.message)
            toast({
                variant: "destructive",
                title: "로그인 실패",
                description: error.message === 'Invalid login credentials' 
                    ? '이메일 또는 비밀번호가 올바르지 않습니다.' 
                    : error.message,
            })
            return false
        }
        return true
    }, [toast])

    return {
        updating,
        loggingOut,
        handleGoogleLogin,
        handleEmailLogin,
        handlePasswordUpdate,
        handleLogout
    }
}
