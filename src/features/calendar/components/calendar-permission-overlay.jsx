import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Loader2, AlertCircle, Settings } from 'lucide-react';

/**
 * 캘린더 접근 권한이 없거나 필수 설정이 누락되었을 때 표시되는 반투명 오버레이
 */
export function CalendarPermissionOverlay({ onConnect, loading, isBackendOnline, mode = 'auth' }) {
    const { t } = useTranslation();
    const isSettingsMode = mode === 'settings';

    return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-100/60 dark:bg-stone-900/60 backdrop-blur-[4px] animate-in fade-in duration-500">
            <Card className="w-full max-w-sm border-2 border-primary/20 shadow-2xl transform scale-95 sm:scale-100 animate-in zoom-in-95 duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                        {isSettingsMode ? t('calendar.settings_required_title') : t('calendar.auth_required_title')}
                    </CardTitle>
                    <CardDescription>
                        {isSettingsMode
                            ? t('calendar.settings_required_desc')
                            : t('calendar.auth_required_desc')
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <Button
                        onClick={onConnect}
                        className="w-full py-6 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        disabled={loading || (!isSettingsMode && !isBackendOnline)}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : isSettingsMode ? (
                            <>
                                <Settings className="mr-2 h-5 w-5" />
                                {t('calendar.open_settings')}
                            </>
                        ) : (
                            <>
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                {t('calendar.continue_with_google')}
                            </>
                        )}
                    </Button>

                    {!isSettingsMode && !isBackendOnline && (
                        <div className="flex items-center justify-center gap-2 text-xs text-destructive font-medium animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            {t('calendar.backend_offline')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
