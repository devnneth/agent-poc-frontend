import { useMemo } from 'react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isToday
} from 'date-fns';
import KoreanLunarCalendar from 'korean-lunar-calendar';

const lunarCalendar = new KoreanLunarCalendar();

export function useCalendarDates(baseDate, viewMode = 'month') {
    // baseDate가 속한 월의 달력 그리드용 날짜 배열 생성
    const calendarDays = useMemo(() => {
        let startDate, endDate;

        if (viewMode === 'week') {
            startDate = startOfWeek(baseDate);
            endDate = endOfWeek(baseDate);
        } else {
            const monthStart = startOfMonth(baseDate);
            const monthEnd = endOfMonth(monthStart);

            // 달력 시작일 (전월 포함)
            startDate = startOfWeek(monthStart);
            // 달력 종료일 (익월 포함)
            endDate = endOfWeek(monthEnd);
        }

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return days.map((date) => {
            // 음력 변환
            lunarCalendar.setSolarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
            const lunarData = lunarCalendar.getLunarCalendar();

            return {
                date,
                isCurrentMonth: isSameMonth(date, baseDate),
                isToday: isToday(date),
                dayOfWeek: date.getDay(), // 0: Sun, 6: Sat
                lunar: {
                    month: lunarData.month,
                    day: lunarData.day,
                    isBigMonth: lunarData.isBigMonth, // 큰달 여부 (UI엔 표시 안해도 됨)
                },
                dateString: format(date, 'yyyy-MM-dd')
            };
        });
    }, [baseDate, viewMode]);

    return { calendarDays };
}
