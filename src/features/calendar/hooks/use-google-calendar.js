
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../../api/supabase';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import { googleCalendarApi } from '../../../api/google/calendar';
import { authService } from '../../../services/auth-service';
import { loadCalendarPreferences, saveCalendarPreferences } from '../../../repositories/preference-repository';

/**
 * 구글 캘린더 연동을 위한 커스텀 훅
 */
export function useGoogleCalendar() {
    const { session } = useAuthSession();
    const [calendars, setCalendars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [authRequired, setAuthRequired] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isBackendOnline, setIsBackendOnline] = useState(true);
    const [selectedCalendarId, setSelectedCalendarId] = useState(() => {
        return loadCalendarPreferences().calendarId;
    });
    const fetchingRef = useRef(false);
    const isBackendOnlineRef = useRef(true);

    // 캘린더 선택 처리
    const selectCalendar = useCallback((id, name) => {
        setSelectedCalendarId(id);
        saveCalendarPreferences({ calendarId: id, calendarName: name });
    }, []);

    // 구글 권한 승인 요청 (OAuth)
    const requestAuthorization = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // 스코프를 공백으로 구분된 문자열로 명시
                    scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent', // 동의 화면 강제 노출하여 권한 누락 방지
                    },
                    redirectTo: window.location.origin + window.location.pathname,
                },
            });
            if (error) throw error;
        } catch (err) {
            console.error('권한 승인 요청 실패:', err);
            setError('권한 승인 중 오류가 발생했습니다.');
        }
    }, []);

    // 구글 세션 및 토큰 초기화/복구 로직 (캘린더 목록 조회 없음)
    const initializeGoogleSession = useCallback(async (activeSession = null) => {
        setError(null);

        // 1. 최신 세션 정보 확보 (인자 우선 -> 없으면 직접 조회)
        let currentSession = activeSession;
        if (!currentSession) {
            const { data } = await supabase.auth.getSession();
            currentSession = data.session;
        }

        // 2. 세션에 provider_token이 없다면 URL 해시에서 시도 (OAuth 리다이렉트 직후 대응)
        let providerToken = currentSession?.provider_token;

        if (!providerToken && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            providerToken = hashParams.get('provider_token');
            if (providerToken) {
                console.log('GoogleCalendar: URL 해시에서 provider_token 발견');
                localStorage.setItem('gplanner_provider_token', providerToken);
            }
        }

        // 3. 여전히 없다면 localStorage에서 조회
        if (!providerToken) {
            providerToken = localStorage.getItem('gplanner_provider_token');
            if (providerToken) {
                console.log('GoogleCalendar: localStorage에서 provider_token 복구');
            }
        }

        if (!currentSession) {
            console.log('GoogleCalendar: 활성 세션 없음');
            // 세션이 아예 없으면 로그인 자체가 안된 것임
            return null;
        }

        // 4. provider_token이 여전히 없다면 백엔드를 통한 복구 시도
        if (!providerToken && currentSession.refresh_token) {
            // 이미 오프라인임이 확인되었다면 재시도하지 않고 바로 종료
            if (!isBackendOnlineRef.current) {
                console.log('GoogleCalendar: 백엔드 오프라인 상태 유지 중 -> 재요청 방지');
                setIsBackendOnline(false);
                setAuthRequired(true);
                return null;
            }

            console.log('GoogleCalendar: provider_token 없음 -> 백엔드 갱신 시도');
            try {
                const refreshedData = await authService.refreshSession(currentSession.refresh_token);

                if (refreshedData && refreshedData.provider_token) {
                    console.log('GoogleCalendar: provider_token 복구 성공');
                    providerToken = refreshedData.provider_token;
                    localStorage.setItem('gplanner_provider_token', providerToken);

                    // 성공 시 온라인 상태로 복구
                    isBackendOnlineRef.current = true;
                    setIsBackendOnline(true);

                    // 복구된 세션 정보를 Supabase 클라이언트에 반영
                    if (refreshedData.access_token && refreshedData.refresh_token) {
                        await supabase.auth.setSession({
                            access_token: refreshedData.access_token,
                            refresh_token: refreshedData.refresh_token
                        });
                    }
                } else {
                    console.warn('GoogleCalendar: 백엔드 갱신 성공했으나 provider_token이 응답에 없음');
                }
            } catch (refreshErr) {
                console.warn('GoogleCalendar: 토큰 복구 실패 (네트워크/서버)', refreshErr);
                // 토큰 복구 실패 시 기존 잘못된 토큰 제거
                localStorage.removeItem('gplanner_provider_token');

                if (refreshErr.message === 'NETWORK_ERROR') {
                    console.log('GoogleCalendar: 백엔드 오프라인 감지됨');
                    isBackendOnlineRef.current = false;
                    setIsBackendOnline(false);
                    setAuthRequired(true);
                    return null;
                }
            }
        }

        if (!providerToken) {
            console.log('GoogleCalendar: provider_token 없음 -> AUTH_REQUIRED');
            setAuthRequired(true);
            return null;
        }

        // 토큰을 찾았다면 권한 필요 상태 해제
        setAuthRequired(false);
        setIsBackendOnline(true);
        isBackendOnlineRef.current = true;

        return { providerToken, currentSession };
    }, []);

    // 캘린더 목록 조회 (설정 화면용)
    const fetchCalendars = useCallback(async (activeSession = null) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setLoading(true);

        try {
            const authData = await initializeGoogleSession(activeSession);
            if (!authData) {
                setLoading(false);
                fetchingRef.current = false;
                return;
            }

            const { providerToken, currentSession } = authData;

            // 토큰 갱신 콜백 정의
            const handleTokenRefreshed = async (newSession) => {
                console.log('GoogleCalendar: 세션 자동 갱신됨');
                if (newSession.provider_token) {
                    localStorage.setItem('gplanner_provider_token', newSession.provider_token);
                }
                if (newSession.access_token && newSession.refresh_token) {
                    await supabase.auth.setSession({
                        access_token: newSession.access_token,
                        refresh_token: newSession.refresh_token
                    });
                }
            };

            const data = await googleCalendarApi.getCalendarList(
                providerToken,
                currentSession.refresh_token,
                handleTokenRefreshed
            );

            console.log('GoogleCalendar: 목록 조회 성공', data.items?.length);
            const items = data.items || [];
            setCalendars(items);
            setCalendars(items);
            if (selectedCalendarId && !loadCalendarPreferences().calendarName) {
                const matched = items.find((item) => item.id === selectedCalendarId);
                if (matched?.summary) {
                    saveCalendarPreferences({ calendarName: matched.summary });
                }
            }
        } catch (err) {
            console.error('GoogleCalendar: 에러 발생', err.message);
            if (err.message === 'INSUFFICIENT_PERMISSION') {
                setError('캘린더 접근 권한이 부족합니다. 다시 승인 시 나타나는 체크박스를 모두 선택해주세요.');
                setAuthRequired(true);
            } else if (err.message === 'AUTH_REQUIRED') {
                setAuthRequired(true);
                localStorage.removeItem('gplanner_provider_token');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
            setIsInitialized(true);
            fetchingRef.current = false;
        }
    }, [initializeGoogleSession, selectedCalendarId]);

    // 초기화: 세션/토큰 상태만 확인 (자동 목록 조회 X)
    const checkAuthStatus = useCallback(async (activeSession = null) => {
        setLoading(true);
        await initializeGoogleSession(activeSession);
        setLoading(false);
        setIsInitialized(true);
    }, [initializeGoogleSession]);

    // 세션 변경 시 권한 상태 재확인 (목록 조회는 하지 않음)
    useEffect(() => {
        if (session) {
            checkAuthStatus(session);
        } else {
            // 세션이 없어도 localStorage 복구 시도 등을 위해 실행
            checkAuthStatus();
        }
    }, [session, checkAuthStatus]);

    // 하위 캘린더 생성
    const createCalendar = useCallback(async (summary, description = '') => {
        if (!session) return;

        setLoading(true);
        setError(null);

        try {
            const token = session.provider_token;
            const refreshToken = session.refresh_token;

            if (!token) throw new Error('AUTH_REQUIRED');

            // 토큰 갱신 콜백 정의
            const handleTokenRefreshed = async (newSession) => {
                console.log('GoogleCalendar: 세션 자동 갱신됨 (이벤트 생성 중)');
                if (newSession.provider_token) {
                    localStorage.setItem('gplanner_provider_token', newSession.provider_token);
                }
                if (newSession.access_token && newSession.refresh_token) {
                    await supabase.auth.setSession({
                        access_token: newSession.access_token,
                        refresh_token: newSession.refresh_token
                    });
                }
            };

            const newCalendar = await googleCalendarApi.createCalendar(
                token,
                refreshToken,
                { summary, description },
                handleTokenRefreshed
            );

            // 목록 갱신 (생성 시에는 최신 목록이 필요할 수 있으므로 갱신)
            await fetchCalendars();

            // 새 캘린더 자동 선택
            if (newCalendar && newCalendar.id) {
                selectCalendar(newCalendar.id, newCalendar.summary || '');
            }

            return newCalendar;
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') {
                setAuthRequired(true);
            } else {
                setError(err.message);
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }, [session, fetchCalendars, selectCalendar]);

    return {
        calendars,
        selectedCalendarId,
        loading,
        error,
        authRequired,
        fetchCalendars,
        createCalendar,
        selectCalendar,
        requestAuthorization,
        isInitialized,
        isBackendOnline
    };
}

