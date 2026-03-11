import { useState, useCallback } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { useCalendarDates } from './use-calendar-dates';
import { useCalendarEvents } from './use-calendar-events';
import { useGoogleCalendar } from './use-google-calendar';
import { useToast } from '@/hooks/use-toast';

/**
 * 캘린더 화면의 상태와 로직을 관리하는 커스텀 훅
 */
export function useCalendar() {
    const { toast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'

    // Modal State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Custom Hooks
    const { calendarDays } = useCalendarDates(currentDate, viewMode);
    const {
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        loading: eventsLoading,
        error: eventsError,
        refreshEvents,
        authUuid,
        isActionLoading
    } = useCalendarEvents(currentDate.getFullYear(), currentDate.getMonth());

    const {
        authRequired,
        loading: authLoading,
        requestAuthorization,
        isInitialized: authInitialized,
        isBackendOnline,
        calendars,
        error,
        createCalendar,
        selectCalendar,
        selectedCalendarId,
        fetchCalendars
    } = useGoogleCalendar();

    // 설정 완료 여부 확인 (캘린더 ID가 있어야 함)
    const settingsRequired = !selectedCalendarId;

    // 페이지 진입 시 권한 상태 확인은 useGoogleCalendar 내부에서 checkAuthStatus로 자동 수행됨


    // Navigation Handlers
    const handlePrev = useCallback(() => {
        if (viewMode === 'week') {
            setCurrentDate(prev => subWeeks(prev, 1));
        } else {
            setCurrentDate(prev => subMonths(prev, 1));
        }
    }, [viewMode]);

    const handleNext = useCallback(() => {
        if (viewMode === 'week') {
            setCurrentDate(prev => addWeeks(prev, 1));
        } else {
            setCurrentDate(prev => addMonths(prev, 1));
        }
    }, [viewMode]);

    const handleToday = useCallback(() => setCurrentDate(new Date()), []);

    const handleWeekClick = useCallback((date) => {
        setCurrentDate(startOfWeek(date));
        setViewMode('week');
    }, []);

    const switchToMonthView = useCallback(() => setViewMode('month'), []);

    const switchToWeekView = useCallback(() => {
        const today = new Date();
        const isSameMonthAsToday =
            currentDate.getFullYear() === today.getFullYear() &&
            currentDate.getMonth() === today.getMonth();

        if (isSameMonthAsToday) {
            setCurrentDate(today);
        } else {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
        }
        setViewMode('week');
    }, [currentDate]);

    // Interaction Handlers
    const handleDateClick = useCallback((date) => {
        setSelectedDate(date);
        setSelectedEvent(null);
        setIsEventModalOpen(true);
    }, []);

    const handleEventClick = useCallback((event) => {
        setSelectedEvent(event);
        setSelectedDate(null);
        setIsEventModalOpen(true);
    }, []);

    const handleEventModalClose = useCallback(() => {
        setIsEventModalOpen(false);
        setSelectedDate(null);
        setSelectedEvent(null);
    }, []);

    const handleEventSubmit = useCallback(async (formData) => {
        try {
            if (selectedEvent) {
                const result = await updateEvent(selectedEvent.id, formData);
                if (result) {
                    toast({ title: '수정 완료', description: '일정이 성공적으로 수정되었습니다.' });
                }
            } else {
                const result = await addEvent(formData);
                if (result) {
                    toast({ title: '저장 완료', description: '일정이 성공적으로 추가되었습니다.' });
                }
            }
            handleEventModalClose();
        } catch {
            toast({ variant: 'destructive', title: '오류', description: '일정 저장 중 오류가 발생했습니다.' });
        }
    }, [selectedEvent, updateEvent, addEvent, handleEventModalClose, toast]);

    const handleEventDelete = useCallback(async (id) => {
        try {
            const result = await deleteEvent(id);
            if (result !== false) {
                toast({ title: '삭제 완료', description: '일정이 삭제되었습니다.' });
            }
            handleEventModalClose();
        } catch {
            toast({ variant: 'destructive', title: '오류', description: '일정 삭제 중 오류가 발생했습니다.' });
        }
    }, [deleteEvent, handleEventModalClose, toast]);

    return {
        currentDate,
        viewMode,
        isEventModalOpen,
        selectedDate,
        selectedEvent,
        calendarDays,
        events,
        authRequired,
        settingsRequired,
        authLoading,
        handlePrev,
        handleNext,
        handleToday,
        handleWeekClick,
        switchToMonthView,
        switchToWeekView,
        handleDateClick,
        handleEventClick,
        handleEventModalClose,
        handleEventSubmit,
        handleEventDelete,
        requestAuthorization,
        authInitialized,
        isBackendOnline,
        calendars,
        googleError: error,
        createCalendar,
        selectCalendar,
        selectedCalendarId,
        fetchCalendars,
        eventsLoading,
        eventsError,
        refreshEvents,
        authUuid,
        isActionLoading
    };
}
