import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleCalendarApi } from '../../../src/api/google/calendar';
import { googleApiService } from '../../../src/api/google/google';

vi.mock('../../../src/api/google/google', () => ({
    googleApiService: {
        fetch: vi.fn(),
    },
}));

describe('googleCalendarApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('insertEvent should call googleApiService.fetch with correct parameters', async () => {
        const mockEvent = { summary: 'Test Event' };
        googleApiService.fetch.mockResolvedValueOnce({ id: 'gcal_123' });

        const result = await googleCalendarApi.insertEvent('token', 'primary', mockEvent);

        expect(googleApiService.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/calendars/primary/events'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(mockEvent),
            }),
            'token',
            undefined,
            undefined
        );
        expect(result.id).toBe('gcal_123');
    });

    it('deleteEvent should call googleApiService.fetch with DELETE method', async () => {
        googleApiService.fetch.mockResolvedValueOnce({});

        await googleCalendarApi.deleteEvent('token', 'primary', 'eventId_123');

        expect(googleApiService.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/calendars/primary/events/eventId_123'),
            expect.objectContaining({
                method: 'DELETE',
            }),
            'token',
            undefined,
            undefined
        );
    });
});
