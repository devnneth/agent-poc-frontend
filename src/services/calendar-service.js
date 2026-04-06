import { googleCalendarEventRepository } from '../repositories/google-calendar-event-repository';
import { googleCalendarApi } from '../api/google/calendar';
import { addDays, parseISO, format } from 'date-fns';

// 일정을 google_calendar_events DB와 Google Calendar에 동기화하여 저장하는 서비스
export const calendarService = {
    /**
     * 동기화된 일정 생성
     * 1. GCal 전송 (External)
     * 2. DB 저장 (google_calendar_events)
     * 실패 시 롤백 (보상 트랜잭션)
     * @param {Object} user - { id: Auth UUID, accessToken, token, refreshToken, onTokenRefreshed }
     * @param {Object} input - { summary, description, start_at, end_at, color_id, icon, ... }
     * @param {Object} gcalConfig - { calendarId }
     */
    async createSyncedSchedule(user, input, gcalConfig) {
        const { token, refreshToken, onTokenRefreshed } = user;
        const { calendarId } = gcalConfig;


        // 1. GCal 전송
        let gcalResult = { id: null };
        if (token) {
            const gcalEvent = this.convertToGcalFormat(input);
            gcalResult = await googleCalendarApi.insertEvent(
                token,
                calendarId,
                gcalEvent,
                refreshToken,
                onTokenRefreshed
            );
        }

        // 2. DB 저장
        let savedEvent = null;
        try {
            savedEvent = await googleCalendarEventRepository.create({
                google_calendar_id: calendarId,
                google_event_id: gcalResult.id,
                owner_user_id: user.id,
                summary: input.summary,
                description: input.description ?? null,
                color_id: String(input.color_id ?? gcalResult.colorId ?? '7'),
                icon: input.icon ?? null,
                start_at: input.start_at ? new Date(input.start_at).toISOString() : null,
                end_at: input.end_at ? new Date(input.end_at).toISOString() : null,
            });
        } catch (e) {
            // DB 저장 실패 시 GCal 이벤트 롤백 (토큰이 있을 때만)
            console.warn('DB save failed, rolling back GCal event:', e);
            if (token && gcalResult.id) {
                try {
                    await googleCalendarApi.deleteEvent(token, calendarId, gcalResult.id, refreshToken, onTokenRefreshed);
                } catch (rollbackErr) {
                    console.warn('GCal rollback failed:', rollbackErr);
                }
            }
            throw e;
        }

        return { id: savedEvent.id, externalId: gcalResult.id };
    },

    /**
     * input 포맷을 Google Calendar API 이벤트 포맷으로 변환
     */
    convertToGcalFormat(input) {
        const startDate = parseISO(input.start_at);
        const endDate = input.end_at ? parseISO(input.end_at) : addDays(startDate, 1);

        return {
            summary: input.summary,
            description: input.description || 'Created by GPlanner PPA',
            start: { dateTime: startDate.toISOString() },
            end: { dateTime: endDate.toISOString() },
            colorId: String(input.color_id || '7'),
        };
    },

    /**
     * 기간 내 일정 조회 후 UI 포맷으로 변환. 필요 시 검색어로 필터링.
     */
    async fetchSchedules(startAt, endAt, searchQuery = '') {
        const events = await googleCalendarEventRepository.findByPeriod(startAt, endAt, searchQuery);
        return events.map((event) => this.convertToUIFormat(event));
    },

    /**
     * DB 이벤트를 UI(CalendarGrid) 포맷으로 변환
     */
    convertToUIFormat(event) {
        return {
            id: event.id,
            title: event.summary,
            description: event.description,
            start: event.start_at ? format(new Date(event.start_at), "yyyy-MM-dd'T'HH:mm:ss") : null,
            end: event.end_at ? format(new Date(event.end_at), "yyyy-MM-dd'T'HH:mm:ss") : null,
            color: event.color_id || '7',
            icon: event.icon ?? null,
            externalId: event.google_event_id,
            extendedProps: {
                icon: event.icon ?? null,
                colorId: event.color_id,
            },
        };
    },

    /**
     * 동기화된 일정 수정
     */
    async updateSyncedSchedule(user, eventId, input, gcalConfig) {
        const { token, refreshToken, onTokenRefreshed } = user;
        const { calendarId } = gcalConfig;


        // 1. DB에서 현재 이벤트 조회
        const existing = await googleCalendarEventRepository.findById(eventId);


        // 2. GCal 업데이트
        if (token && existing?.google_event_id) {
            try {
                const gcalEvent = this.convertToGcalFormat(input);
                await googleCalendarApi.updateEvent(
                    token,
                    calendarId,
                    existing.google_event_id,
                    gcalEvent,
                    refreshToken,
                    onTokenRefreshed
                );
            } catch (e) {
                console.warn('GCal update failed:', e);
            }
        }

        // 3. DB 업데이트
        const updated = await googleCalendarEventRepository.update(eventId, {
            summary: input.summary,
            description: input.description ?? null,
            color_id: String(input.color_id || existing?.color_id || '7'),
            icon: input.icon ?? existing?.icon ?? null,
            start_at: input.start_at ? new Date(input.start_at).toISOString() : null,
            end_at: input.end_at ? new Date(input.end_at).toISOString() : null,
        });

        return updated;
    },

    /**
     * 동기화된 일정 삭제 (소프트 삭제 + GCal 삭제)
     */
    async deleteSyncedSchedule(user, eventId, gcalConfig) {
        const { token, refreshToken, onTokenRefreshed } = user;
        const { calendarId } = gcalConfig;


        // 1. DB에서 현재 이벤트 조회
        const existing = await googleCalendarEventRepository.findById(eventId);

        // 2. GCal 삭제 시도
        if (token && existing?.google_event_id) {
            try {
                await googleCalendarApi.deleteEvent(
                    token,
                    calendarId,
                    existing.google_event_id,
                    refreshToken,
                    onTokenRefreshed
                );
            } catch (e) {
                console.warn('GCal delete failed:', e);
            }
        }

        // 3. DB 소프트 삭제
        await googleCalendarEventRepository.softDelete(eventId);
    },
};
