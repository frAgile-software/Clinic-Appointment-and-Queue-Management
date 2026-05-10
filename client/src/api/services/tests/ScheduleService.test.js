import { ScheduleService } from "../ScheduleService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(ScheduleService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('ScheduleService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};

        service = new ScheduleService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.clearAllMocks());

    describe('constructor', () => {

        it('should set basePath to /schedules', async () => {
            expect(service.basePath).toBe('/schedules');
        });

        it('should assign public and private clients', async () => {
            expect(service.pub).toBe(mockPublicClient);
            expect(service.priv).toBe(mockPrivateClient);
        });
    });

    describe('getSchedule', () => {
        it('should call GET on the correct path', () => {
            const userId = 'user-123';
            service.getSchedule(userId);
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                '/schedules/user-123',
                null
            );
        });
    });

    describe('update', () => {
        const scheduleId = 'schedule-123';
        const payload = {
            Staff: 'staff-uid-1',
            DayOfWeek: 'Monday',
            StartTime: '08:00',
            EndTime: '16:00',
        };

        it('should call PUT on the correct path with the correct body', () => {
            service.update(scheduleId, payload);
            expect(mockPrivateClient.put).toHaveBeenCalledWith(
                '/schedules/schedule-123',
                { Staff: payload.Staff, DayOfWeek: payload.DayOfWeek, StartTime: payload.StartTime, EndTime: payload.EndTime },
                null
            );
        });

        it('should pass keys to the request body', () => {
            service.update(scheduleId, payload);
            const body = mockPrivateClient.put.mock.calls[0][1];
            expect(body).toHaveProperty('Staff');
            expect(body).toHaveProperty('DayOfWeek');
            expect(body).toHaveProperty('StartTime');
            expect(body).toHaveProperty('EndTime');
        });

        it('should pass undefined for any omitted fields', () => {
            service.update(scheduleId, { Staff: 'staff-uid-1' });
            const body = mockPrivateClient.put.mock.calls[0][1];
            expect(body.Staff).toBe('staff-uid-1');
            expect(body.DayOfWeek).toBeUndefined();
            expect(body.StartTime).toBeUndefined();
            expect(body.EndTime).toBeUndefined();
        });
    });
});