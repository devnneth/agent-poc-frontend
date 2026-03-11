import { describe, it, expect, vi, beforeEach } from 'vitest';
import { format } from 'date-fns';
import { calendarService } from '../../../src/services/calendar-service';
import { googleCalendarEventRepository } from '../../../src/repositories/google-calendar-event-repository';
import { googleCalendarApi } from '../../../src/api/google/calendar';
import { embeddingService } from '../../../src/services/embedding-service';
import { embeddingRepository } from '../../../src/repositories/embedding-repository';

vi.mock('../../../src/repositories/google-calendar-event-repository', () => ({
    googleCalendarEventRepository: {
        create: vi.fn(),
        findById: vi.fn(),
        findByPeriod: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
    },
}));

vi.mock('../../../src/api/google/calendar', () => ({
    googleCalendarApi: {
        insertEvent: vi.fn(),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn(),
    },
}));

vi.mock('../../../src/services/embedding-service', () => ({
    embeddingService: {
        createEmbedding: vi.fn(),
    },
}));

vi.mock('../../../src/repositories/embedding-repository', () => ({
    embeddingRepository: {
        create: vi.fn(),
        update: vi.fn(),
    },
}));

describe('calendarService', () => {
    const mockUser = { id: 'fake-uuid', token: 'fake-token', accessToken: 'access-token' };
    const mockInput = {
        summary: 'Dinner',
        start_at: '2024-01-01T19:00:00',
        end_at: '2024-01-01T20:00:00',
        color_id: '7',
    };
    const mockGcalConfig = { calendarId: 'primary' };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        embeddingService.createEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
        embeddingRepository.create.mockResolvedValue('emb-123');
        embeddingRepository.update.mockResolvedValue(true);
    });

    it('createSyncedSchedule should succeed and save to DB', async () => {
        googleCalendarApi.insertEvent.mockResolvedValueOnce({ id: 'gcal_1', colorId: '7' });
        googleCalendarEventRepository.create.mockResolvedValueOnce({ id: 1, google_event_id: 'gcal_1' });

        const result = await calendarService.createSyncedSchedule(mockUser, mockInput, mockGcalConfig);

        expect(embeddingService.createEmbedding).toHaveBeenCalled();
        expect(googleCalendarApi.insertEvent).toHaveBeenCalled();
        expect(googleCalendarEventRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            summary: 'Dinner',
            google_event_id: 'gcal_1',
            owner_user_id: 'fake-uuid',
            embedding_id: 'emb-123',
            start_at: new Date(mockInput.start_at).toISOString(),
            end_at: new Date(mockInput.end_at).toISOString(),
        }));
        expect(result).toEqual({ id: 1, externalId: 'gcal_1' });
    });

    it('createSyncedSchedule should rollback GCal if DB save fails', async () => {
        googleCalendarApi.insertEvent.mockResolvedValueOnce({ id: 'gcal_1' });
        googleCalendarEventRepository.create.mockRejectedValueOnce(new Error('DB Error'));

        await expect(calendarService.createSyncedSchedule(mockUser, mockInput, mockGcalConfig))
            .rejects.toThrow('DB Error');

        expect(googleCalendarApi.deleteEvent).toHaveBeenCalledWith(
            mockUser.token, mockGcalConfig.calendarId, 'gcal_1', undefined, undefined
        );
    });

    it('createSyncedSchedule should continue when embedding fails', async () => {
        embeddingService.createEmbedding.mockRejectedValueOnce(new Error('Embedding Error'));
        googleCalendarApi.insertEvent.mockResolvedValueOnce({ id: 'gcal_1' });
        googleCalendarEventRepository.create.mockResolvedValueOnce({ id: 1 });

        await calendarService.createSyncedSchedule(mockUser, mockInput, mockGcalConfig);

        expect(googleCalendarEventRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({ embedding_id: null })
        );
    });

    it('createSyncedSchedule should skip GCal but save to DB if token is missing', async () => {
        const userWithoutToken = { id: 'fake-uuid', accessToken: 'access-token' };
        googleCalendarEventRepository.create.mockResolvedValueOnce({ id: 1, google_event_id: null });

        const result = await calendarService.createSyncedSchedule(userWithoutToken, mockInput, mockGcalConfig);

        expect(googleCalendarApi.insertEvent).not.toHaveBeenCalled();
        expect(googleCalendarEventRepository.create).toHaveBeenCalled();
        expect(result).toEqual({ id: 1, externalId: null });
    });

    it('updateSyncedSchedule should update GCal and DB', async () => {
        googleCalendarEventRepository.findById.mockResolvedValueOnce({
            id: 1,
            google_event_id: 'gcal_1',
            color_id: '7',
        });
        googleCalendarEventRepository.update.mockResolvedValueOnce({ id: 1 });

        await calendarService.updateSyncedSchedule(mockUser, 1, mockInput, mockGcalConfig);

        expect(googleCalendarApi.updateEvent).toHaveBeenCalled();
        expect(googleCalendarEventRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
            summary: 'Dinner',
            embedding_id: 'emb-123',
            start_at: new Date(mockInput.start_at).toISOString(),
            end_at: new Date(mockInput.end_at).toISOString(),
        }));
    });

    it('updateSyncedSchedule should skip GCal but update DB if token is missing', async () => {
        const userWithoutToken = { id: 'fake-uuid', accessToken: 'access-token' };
        googleCalendarEventRepository.findById.mockResolvedValueOnce({ id: 1, google_event_id: 'gcal_1' });
        googleCalendarEventRepository.update.mockResolvedValueOnce({ id: 1 });

        const result = await calendarService.updateSyncedSchedule(userWithoutToken, 1, mockInput, mockGcalConfig);

        expect(googleCalendarApi.updateEvent).not.toHaveBeenCalled();
        expect(googleCalendarEventRepository.update).toHaveBeenCalled();
        expect(result).toEqual({ id: 1 });
    });

    it('deleteSyncedSchedule should skip GCal but soft delete in DB if token is missing', async () => {
        const userWithoutToken = { id: 'fake-uuid' };
        googleCalendarEventRepository.findById.mockResolvedValueOnce({ id: 1, google_event_id: 'gcal_1' });

        await calendarService.deleteSyncedSchedule(userWithoutToken, 1, mockGcalConfig);

        expect(googleCalendarApi.deleteEvent).not.toHaveBeenCalled();
        expect(googleCalendarEventRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('convertToGcalFormat should return correct dateTime format', () => {
        const result = calendarService.convertToGcalFormat(mockInput);

        expect(result.start.dateTime).toBeDefined();
        expect(result.end.dateTime).toBeDefined();
        expect(result.summary).toBe('Dinner');
        expect(result.colorId).toBe('7');
    });

    it('convertToUIFormat should map fields from google_calendar_events', () => {
        const mockEvent = {
            id: 1,
            summary: 'Test Schedule',
            description: 'Test Description',
            start_at: '2024-01-01T09:00:00.000Z',
            end_at: '2024-01-01T10:00:00.000Z',
            color_id: '2',
            icon: 'Bell',
            google_event_id: 'gcal_1',
        };

        const result = calendarService.convertToUIFormat(mockEvent);

        expect(result.title).toBe('Test Schedule');
        expect(result.description).toBe('Test Description');
        expect(result.start).toBe(format(new Date(mockEvent.start_at), "yyyy-MM-dd'T'HH:mm:ss"));
        expect(result.end).toBe(format(new Date(mockEvent.end_at), "yyyy-MM-dd'T'HH:mm:ss"));
        expect(result.color).toBe('2');
        expect(result.icon).toBe('Bell');
        expect(result.externalId).toBe('gcal_1');
    });
});
