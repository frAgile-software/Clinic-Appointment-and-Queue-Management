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

    describe('createDefault', () => {
        it('should call POST to the bulk path with staffId and schedules', () => {
            const auth0Id = 'auth0|staff-1';
            const schedules = [
                { DayOfWeek: '0', StartTime: '08:00', EndTime: '16:00' },
                { DayOfWeek: '1', StartTime: '09:00', EndTime: '17:00' },
            ];

            service.createDefault(auth0Id, schedules);

            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/schedules/bulk',
                { userId: auth0Id, schedules },
                null
            );
        });
    });

    describe('create', () => {
        it('should call POST to basePath with the schedule fields', () => {
            service.create({
                staffId: 'auth0|staff-1',
                DayOfWeek: 2,
                StartTime: '09:00',
                EndTime: '10:00',
            });

            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/schedules',
                { staffId: 'auth0|staff-1', DayOfWeek: 2, StartTime: '09:00', EndTime: '10:00' },
                null
            );
        });
    });

    describe('delete', () => {
        it('should call DELETE with the scheduleId and staffId as a query param', () => {
            service.delete('sched-001', 'auth0|staff-1');

            expect(mockPrivateClient.delete).toHaveBeenCalledWith(
                '/schedules/sched-001?staffId=auth0%7Cstaff-1',
                null
            );
        });
    });

    describe('getOffDays', () => {
        it('should call GET on the off-days path with the encoded staffId', () => {
            service.getOffDays('auth0|staff-1');

            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                '/schedules/off-days/auth0%7Cstaff-1',
                null
            );
        });
    });

    describe('createOffDays', () => {
        it('should call POST to the off-days path with staffId and dates', () => {
            const dates = ['2025-08-01', '2025-08-02'];
            service.createOffDays('auth0|staff-1', dates);

            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/schedules/off-days',
                { staffId: 'auth0|staff-1', dates },
                null
            );
        });
    });

    describe('deleteOffDay', () => {
        it('should call DELETE on the off-days path with the offDayId', () => {
            service.deleteOffDay('offday-999');

            expect(mockPrivateClient.delete).toHaveBeenCalledWith(
                '/schedules/off-days/offday-999',
                null
            );
        });
    });
});