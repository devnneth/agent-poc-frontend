import { googleApiService } from './google';

/**
 * Google Calendar API 호출을 담당하는 어댑터
 */
export const googleCalendarApi = {
    /**
     * 새 이벤트 삽입
     * @param {string} token - Google OAuth Token
     * @param {string} calendarId - Target Calendar ID (e.g., 'primary')
     * @param {object} event - Google Calendar Event Object
     * @param {string} refreshToken - Refresh Token for auto-refresh
     * @param {function} onTokenRefreshed - Callback when token is refreshed
     */
    async insertEvent(token, calendarId, event, refreshToken, onTokenRefreshed) {
        const targetId = calendarId || 'primary';
        const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetId)}/events`;

        return await googleApiService.fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(event),
        }, token, refreshToken, onTokenRefreshed);
    },

    /**
     * 이벤트 업데이트
     * @param {string} token - Google OAuth Token
     * @param {string} calendarId - Target Calendar ID
     * @param {string} eventId - Google Event ID
     * @param {object} event - Updated Event Object
     * @param {string} refreshToken - Refresh Token
     * @param {function} onTokenRefreshed - Callback
     */
    async updateEvent(token, calendarId, eventId, event, refreshToken, onTokenRefreshed) {
        const targetId = calendarId || 'primary';
        const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetId)}/events/${eventId}`;

        return await googleApiService.fetch(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(event),
        }, token, refreshToken, onTokenRefreshed);
    },

    /**
     * 이벤트 삭제
     * @param {string} token - Google OAuth Token
     * @param {string} calendarId - Target Calendar ID
     * @param {string} eventId - Google Event ID
     * @param {string} refreshToken - Refresh Token
     * @param {function} onTokenRefreshed - Callback
     */
    async deleteEvent(token, calendarId, eventId, refreshToken, onTokenRefreshed) {
        const targetId = calendarId || 'primary';
        const endpoint = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetId)}/events/${eventId}`;

        return await googleApiService.fetch(endpoint, {
            method: 'DELETE',
        }, token, refreshToken, onTokenRefreshed);
    },

    /**
     * 사용자의 캘린더 목록 조회
     */
    async getCalendarList(token, refreshToken, onTokenRefreshed) {
        const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
        return googleApiService.fetch(url, { method: 'GET' }, token, refreshToken, onTokenRefreshed);
    },

    /**
     * 새 하위 캘린더 생성
     */
    async createCalendar(token, refreshToken, { summary, description }, onTokenRefreshed) {
        const url = 'https://www.googleapis.com/calendar/v3/calendars';
        return googleApiService.fetch(url, {
            method: 'POST',
            body: JSON.stringify({ summary, description }),
        }, token, refreshToken, onTokenRefreshed);
    }
};
