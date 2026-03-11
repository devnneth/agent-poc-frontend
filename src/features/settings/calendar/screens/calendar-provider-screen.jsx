import { useTranslation } from 'react-i18next';
import { Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCalendarProviderSettings } from '../hooks/use-calendar-provider-settings';
import { GoogleConnectCard } from '../components/google-connect-card';
import { CalendarSelectionList } from '../components/calendar-selection-list';
import { useToast } from '@/hooks/use-toast';

/**
 * 구글 캘린더 연동 및 캘린더 선택 설정을 담당하는 화면 (Screen 레이어)
 */
export function CalendarProviderScreen() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const {
        authRequired,
        selectedCalendarId,
        loading,
        error,
        isBackendOnline,
        calendars,
        handleRefresh,
        requestAuthorization,
        selectCalendar
    } = useCalendarProviderSettings();

    const handleCalendarSelect = (calendar) => {
        selectCalendar(calendar?.id, calendar?.summary);
        toast({
            title: t('settings.calendar_config_complete'),
            description: t('settings.calendar_changed'),
            duration: 5000,
        });
    };

    if (authRequired) {
        return (
            <GoogleConnectCard
                loading={loading}
                isBackendOnline={isBackendOnline}
                onConnect={requestAuthorization}
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                category="Integration"
                title={t('settings.calendar_title')}
                description={t('settings.calendar_desc')}
            />
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">{t('settings.google_connected')}</span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="gap-2"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {t('settings.refresh')}
                </Button>
            </div>

            <CalendarSelectionList
                calendars={calendars}
                selectedCalendarId={selectedCalendarId}
                onSelect={handleCalendarSelect}
            />

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}

