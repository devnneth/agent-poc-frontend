import { useTranslation } from 'react-i18next';
import { Check, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * 연결된 구글 계정의 캘린더 리스트 및 선택 UI
 */
export function CalendarSelectionList({ calendars, selectedCalendarId, onSelect }) {
    const { t } = useTranslation();
    if (calendars.length === 0) {
        return (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-muted">
                <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-8 w-8 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">{t('settings.empty_calendars')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {calendars.map((cal) => {
                const isSelected = selectedCalendarId === cal.id;
                return (
                    <Card
                        key={cal.id}
                        onClick={() => onSelect(cal)}
                        className={cn(
                            "relative flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-muted/50",
                            isSelected ? "ring-2 ring-primary bg-primary/5" : "border-muted"
                        )}
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: cal.backgroundColor || '#137fec' }}
                            />
                            <div className="truncate">
                                <p className="font-semibold text-sm truncate">{cal.summary}</p>
                                {cal.primary && (
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{t('settings.primary_calendar')}</span>
                                )}
                            </div>
                        </div>
                        {isSelected && (
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="h-3 w-3" />
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}

