import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { CalendarHeader } from '../components/calendar-header';
import { CalendarGrid } from '../components/calendar-grid';
import { EventModal } from '../components/event-modal';
import { CalendarPermissionOverlay } from '../components/calendar-permission-overlay';
import { useCalendar } from '../hooks/use-calendar';
import { useAuthSession } from '../../auth/hooks/use-auth-session';
import { useToast } from '@/hooks/use-toast';
import { loadCalendarPreferences } from '../../../repositories/preference-repository';

export function CalendarScreen() {
    const { t } = useTranslation();
    const { session } = useAuthSession();
    const { toast } = useToast();
    const {
        currentDate,
        viewMode,
        isEventModalOpen,
        selectedDate,
        selectedEvent,
        calendarDays,
        events,
        authRequired,
        authLoading,
        authInitialized,
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
        isBackendOnline,
        isActionLoading,
        eventsLoading
    } = useCalendar();

    // 초기 페이지 로딩 + 일정 조회 로딩
    const isLoading = !authInitialized || eventsLoading;

    const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const hasCompletedInitialLoad = useRef(false);

    useEffect(() => {
        if (isLoading) return;

        if (!hasCompletedInitialLoad.current) {
            hasCompletedInitialLoad.current = true;
            const fadeTimer = setTimeout(() => {
                setIsFadingOut(true);
            }, 0);
            const hideTimer = setTimeout(() => {
                setShowLoadingOverlay(false);
                setIsFadingOut(false);
            }, 300);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [isLoading]);

    const copyContextToClipboard = async () => {
        try {
            const preferences = loadCalendarPreferences();
            const payload = {
                generatedAt: new Date().toISOString(),
                user: session?.user
                    ? {
                        id: session.user.id,
                        email: session.user.email ?? null
                    }
                    : null,
                calendar: {
                    viewMode,
                    currentDate: currentDate.toISOString(),
                    selected: {
                        calendarId: preferences.calendarId ?? null,
                        calendarName: preferences.calendarName ?? null
                    }
                }
            };
            const text = JSON.stringify(payload, null, 2);

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            toast({
                title: t('calendar.copy_success'),
                description: t('calendar.copy_success_desc')
            });
        } catch (error) {
            console.error('JSON 복사 실패:', error);
            toast({
                variant: 'destructive',
                title: t('calendar.copy_fail'),
                description: t('calendar.copy_fail_desc')
            });
        }
    };

    return (
        <div className="h-full flex flex-col p-4 w-full relative">
            {showLoadingOverlay && (
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'} ${isLoading ? 'pointer-events-auto' : 'pointer-events-none'}`}
                >
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            )}
            <CalendarHeader
                currentDate={currentDate}
                viewMode={viewMode}
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
                onMonthView={switchToMonthView}
                onWeekView={switchToWeekView}
                onCopyContext={copyContextToClipboard}
                authRequired={authRequired}
                onConnect={requestAuthorization}
                loading={authLoading}
                isBackendOnline={isBackendOnline}
            />

            <div className="flex-1 min-h-0 overflow-hidden">
                <CalendarGrid
                    days={calendarDays}
                    events={events}
                    viewMode={viewMode}
                    currentDate={currentDate}
                    onDateClick={handleDateClick}
                    onEventClick={handleEventClick}
                    onWeekClick={handleWeekClick}
                />
            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={handleEventModalClose}
                onSubmit={handleEventSubmit}
                onDelete={handleEventDelete}
                initialData={selectedEvent}
                selectedDate={selectedDate}
                isSubmitting={isActionLoading}
            />
        </div>
    );
}

