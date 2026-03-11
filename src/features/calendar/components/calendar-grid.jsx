import { startOfDay, endOfDay, isWithinInterval, getWeek } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Bell } from 'lucide-react';

/**
 * 일정 바 컴포넌트
 * extendedProps.reminder 가 있으면 알림 아이콘과 시간을 표시
 */
function EventBar({ event, onClick }) {
    const colorMap = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800',
        green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800',
        red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800',
        orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800',
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-800',
        gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    };

    // Google Calendar colorId 매핑
    const idToColorMap = {
        '1': 'purple',   // Lavender
        '2': 'green',    // Sage
        '3': 'purple',   // Grape
        '4': 'red',      // Flamingo
        '5': 'orange',   // Banana
        '6': 'orange',   // Tangerine
        '7': 'blue',     // Peacock
        '8': 'gray',     // Graphite
        '9': 'blue',     // Blueberry
        '10': 'green',   // Basil
        '11': 'red'      // Tomato
    };

    const colorKey = idToColorMap[String(event.color)] || event.color;
    const styleClass = colorMap[colorKey] || colorMap.gray;

    // 알림 시간 표시 (extendedProps.reminder에서 가져옴)
    const reminderTime = event.extendedProps?.reminder;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick(event);
            }}
            className={`
        px-1.5 py-0.5 mt-1 text-[11px] rounded border truncate cursor-pointer select-none
        transition-all hover:brightness-95 dark:hover:brightness-110 active:scale-[0.98]
        shrink-0 flex items-center gap-1
        ${styleClass}
      `}
        >
            {reminderTime && (
                <span className="flex items-center gap-0.5 shrink-0 opacity-70">
                    <Bell size={10} />
                    <span className="text-[9px]">{reminderTime}</span>
                </span>
            )}
            <span className="truncate">{event.title}</span>
        </div>
    );
}


function DayCell({ dayInfo, events, onClick, onEventClick, isWeekView }) {
    const { date, isCurrentMonth, isToday, dayOfWeek, lunar } = dayInfo;

    // 요일 색상 처리
    let dateColorClass = 'text-stone-700 dark:text-stone-300';
    // Week View에서는 항상 선명하게 표시
    if (dayOfWeek === 0) dateColorClass = 'text-red-500 dark:text-red-400';
    else if (dayOfWeek === 6) dateColorClass = 'text-blue-500 dark:text-blue-400';

    // 현재 월이 아니면 흐리게 처리 (Month View에서만)
    if (!isWeekView && !isCurrentMonth) {
        dateColorClass = 'text-stone-300 dark:text-stone-700'; // much lighter
    }

    // 오늘 날짜 하이라이트
    // 오늘 날짜 표시 스타일 (숫자 부분)
    const todayRingClass = isToday
        ? 'w-7 h-7 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400'
        : 'w-7 h-7 flex items-center justify-center';

    return (
        <div
            className={`
        h-full p-1 border-b border-r border-stone-200 dark:border-stone-800 
        transition-colors hover:bg-stone-50 dark:hover:bg-stone-900 cursor-pointer
        flex flex-col relative overflow-hidden
        ${!isWeekView && !isCurrentMonth ? 'bg-stone-50/30 dark:bg-black/20' : ''}
        ${isWeekView ? 'min-h-[150px]' : ''}
        ${isToday ? 'ring-2 ring-inset ring-blue-500/50 z-10' : ''}
      `}
            onClick={() => onClick(date)}
        >
            {/* Week View에서는 상단 헤더에 날짜가 있으므로 여기서는 숨기거나 타임라인 스타일로 변경 가능하지만, 
                현재 요구사항상 '일자별로 컬럼으로 쭉 길어지는 형태'이므로 날짜 표시는 유지하되, 
                Week View 헤더에 날짜가 있다면 중복될 수 있음. 
                그러나 사용자 요구사항에 '헤더의 날짜 표시'가 명시되어 있어, DayCell 내부 날짜는 선택적.
                여기서는 Month View와 통일성을 위해 유지하되, Week View Header가 날짜를 포함하면 숨길 수도 있음.
                (일단 유지)
             */}
            {!isWeekView && (
                <div className="flex justify-between items-start">
                    <span className={`${dateColorClass} ${todayRingClass} text-sm`}>
                        {date.getDate()}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-600 mt-1 mr-1">
                        {lunar.month}.{lunar.day}
                    </span>
                </div>
            )}

            <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-y-auto min-h-0">
                {events.map(event => (
                    <EventBar key={event.id} event={event} onClick={onEventClick} />
                ))}
            </div>
        </div>
    );
}

export function CalendarGrid({ days, events, viewMode, onDateClick, onEventClick, onWeekClick }) {
    const { t } = useTranslation();
    const weekDays = [
        t('calendar.days.sun'),
        t('calendar.days.mon'),
        t('calendar.days.tue'),
        t('calendar.days.wed'),
        t('calendar.days.thu'),
        t('calendar.days.fri'),
        t('calendar.days.sat'),
    ];

    const getEventsForDay = (date) => {
        return events.filter(event => {
            const start = startOfDay(new Date(event.start));
            const end = endOfDay(new Date(event.end));
            const current = startOfDay(date);
            return isWithinInterval(current, { start, end });
        });
    };

    const isWeekView = viewMode === 'week';
    const rowsCount = Math.ceil(days.length / 7);

    return (
        <div className="flex flex-col border-t border-l border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-[#121212] h-full">
            {/* 헤더 Row */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 shrink-0">
                {/* Month View일 때만 주차 헤더 칸 표시 (빈칸) */}
                {!isWeekView && (
                    <div className="w-10 border-r border-stone-200 dark:border-stone-800 flex items-center justify-center text-xs text-stone-400 font-medium">
                        {t('calendar.week_header')}
                    </div>
                )}

                {/* 요일 헤더 */}
                <div className="flex-1 grid grid-cols-7">
                    {weekDays.map((day, idx) => {
                        let colorClass = 'text-stone-500 dark:text-stone-400';
                        if (idx === 0) colorClass = 'text-red-500 dark:text-red-400';
                        if (idx === 6) colorClass = 'text-blue-500 dark:text-blue-400';

                        // Week View일 경우 날짜도 함께 표시 (예: 26 일)
                        const dateText = isWeekView && days[idx] ? days[idx].date.getDate() : '';

                        return (
                            <div key={day} className={`py-2 text-center text-sm font-semibold ${colorClass} flex flex-col items-center justify-center`}>
                                <span>{day}</span>
                                {isWeekView && <span className="text-xs mt-0.5">{dateText}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 바디 Row */}
            <div className="flex-1 flex min-h-0">
                {/* Month View일 때만 좌측 주차 컬럼 표시 */}
                {!isWeekView && (
                    <div className="w-10 flex flex-col border-r border-stone-200 dark:border-stone-800">
                        {Array.from({ length: rowsCount }).map((_, rowIndex) => {
                            // 각 행의 첫 번째 날짜를 기준으로 주차 계산
                            const weekStartDay = days[rowIndex * 7]?.date;
                            if (!weekStartDay) return <div key={rowIndex} className="flex-1"></div>;

                            const weekNum = getWeek(weekStartDay);

                            return (
                                <div
                                    key={rowIndex}
                                    className="flex-1 flex items-center justify-center text-xs text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors border-b border-stone-100 dark:border-stone-800 last:border-0"
                                    onClick={() => onWeekClick(weekStartDay)}
                                    title={t('calendar.week_view_title', { week: weekNum })}
                                >
                                    {weekNum}{t('calendar.week_unit')}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 날짜 그리드 */}
                <div
                    className="flex-1 grid grid-cols-7 min-h-0"
                    style={{ gridTemplateRows: isWeekView ? '1fr' : `repeat(${rowsCount}, minmax(0, 1fr))` }}
                >
                    {days.map((dayInfo) => (
                        <DayCell
                            key={dayInfo.dateString}
                            dayInfo={dayInfo}
                            events={getEventsForDay(dayInfo.date)}
                            onClick={onDateClick}
                            onEventClick={onEventClick}
                            isWeekView={isWeekView}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
