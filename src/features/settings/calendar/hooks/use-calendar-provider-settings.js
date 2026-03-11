import { useEffect, useCallback } from 'react';
import { useGoogleCalendar } from '../../../calendar/hooks/use-google-calendar';

/**
 * 구글 캘린더 설정 화면을 위한 비즈니스 로직 훅
 */
export function useCalendarProviderSettings() {
    const {
        authRequired,
        selectedCalendarId,
        loading,
        error,
        isBackendOnline,
        calendars,
        fetchCalendars,
        requestAuthorization,
        selectCalendar
    } = useGoogleCalendar();

    useEffect(() => {
        fetchCalendars();
    }, [fetchCalendars]);

    const handleRefresh = useCallback(() => {
        fetchCalendars();
    }, [fetchCalendars]);

    return {
        authRequired,
        selectedCalendarId,
        loading,
        error,
        isBackendOnline,
        calendars,
        handleRefresh,
        requestAuthorization,
        selectCalendar
    };
}
