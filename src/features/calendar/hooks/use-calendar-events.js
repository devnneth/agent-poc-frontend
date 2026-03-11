/**
 * 캘린더 일정 관리를 위한 커스텀 훅
 * google_calendar_events 테이블 기반 calendarService를 사용
 */
import { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { calendarService } from '../../../services/calendar-service';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import { supabase } from '../../../api/supabase';

export function useCalendarEvents(year, month) {
    const { session } = useAuthSession();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 현재 월의 시작/종료 시각 계산 (ISO 8601)
    const getDateRange = useCallback(() => {
        const now = new Date();
        const y = year ?? now.getFullYear();
        const m = month ?? now.getMonth();

        const currentDate = new Date(y, m, 1);
        const startAt = startOfMonth(currentDate).toISOString();
        const endAt = endOfMonth(currentDate).toISOString();
        return { startAt, endAt };
    }, [year, month]);

    // 일정 조회
    const fetchEvents = useCallback(async () => {
        if (!session?.user?.id) return;

        // year나 month가 없으면(설정 화면 등) 일정 조회를 수행하지 않음
        if (year === undefined || month === undefined) return;

        setLoading(true);
        setError(null);

        try {
            const { startAt, endAt } = getDateRange();
            const data = await calendarService.fetchSchedules(startAt, endAt);
            setEvents(data);
        } catch (err) {
            console.error('일정 조회 실패:', err);
            setError('일정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, year, month, getDateRange]);

    // 초기 로드
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // 선택된 캘린더 ID 가져오기
    const getCalendarConfig = useCallback(() => {
        const calendarId = localStorage.getItem('gplanner_selected_calendar_id');
        return { calendarId: calendarId || 'primary' };
    }, []);

    // 사용자 인증 정보 구성
    const getUserConfig = useCallback(() => {
        if (!session) return null;

        return {
            id: session.user.id,
            accessToken: session.access_token,
            token: session.provider_token,
            refreshToken: session.refresh_token,
            onTokenRefreshed: async (newSession) => {
                console.log('GoogleCalendar: 세션 자동 갱신됨 (일정 관리 중)');
                if (newSession.provider_token) {
                    localStorage.setItem('gplanner_provider_token', newSession.provider_token);
                }
                if (newSession.access_token && newSession.refresh_token) {
                    await supabase.auth.setSession({
                        access_token: newSession.access_token,
                        refresh_token: newSession.refresh_token,
                    });
                }
            },
        };
    }, [session]);

    const [isActionLoading, setIsActionLoading] = useState(false);

    // 일정 추가
    const addEvent = useCallback(async (formData) => {
        const user = getUserConfig();
        const gcalConfig = getCalendarConfig();

        if (!user) throw new Error('로그인이 필요합니다.');

        setIsActionLoading(true);

        try {
            const input = {
                summary: formData.summary,
                description: formData.description ?? null,
                start_at: formData.start_at,
                end_at: formData.end_at,
                color_id: formData.color_id ?? null,
                icon: formData.icon ?? null,
                calendar_name: localStorage.getItem('gplanner_selected_calendar_name') || '',
            };

            const result = await calendarService.createSyncedSchedule(user, input, gcalConfig);
            await fetchEvents();
            return result;
        } catch (err) {
            console.error('일정 추가 실패:', err);
            throw err;
        } finally {
            setIsActionLoading(false);
        }
    }, [getUserConfig, getCalendarConfig, fetchEvents]);

    // 일정 수정
    const updateEvent = useCallback(async (id, formData) => {
        const user = getUserConfig();
        const gcalConfig = getCalendarConfig();

        if (!user) throw new Error('로그인이 필요합니다.');

        setIsActionLoading(true);
        try {
            const input = {
                summary: formData.summary,
                description: formData.description ?? null,
                start_at: formData.start_at,
                end_at: formData.end_at,
                color_id: formData.color_id ?? null,
                icon: formData.icon ?? null,
                calendar_name: localStorage.getItem('gplanner_selected_calendar_name') || '',
            };

            const result = await calendarService.updateSyncedSchedule(user, id, input, gcalConfig);
            await fetchEvents();
            return result;
        } catch (err) {
            console.error('일정 수정 실패:', err);
            throw err;
        } finally {
            setIsActionLoading(false);
        }
    }, [getUserConfig, getCalendarConfig, fetchEvents]);

    // 일정 삭제
    const deleteEvent = useCallback(async (id) => {
        const user = getUserConfig();
        const gcalConfig = getCalendarConfig();

        if (!user) throw new Error('로그인이 필요합니다.');

        setIsActionLoading(true);
        try {
            await calendarService.deleteSyncedSchedule(user, id, gcalConfig);
            await fetchEvents();
        } catch (err) {
            console.error('일정 삭제 실패:', err);
            throw err;
        } finally {
            setIsActionLoading(false);
        }
    }, [getUserConfig, getCalendarConfig, fetchEvents]);

    return {
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        refreshEvents: fetchEvents,
        authUuid: session?.user?.id,
        isActionLoading,
    };
}
