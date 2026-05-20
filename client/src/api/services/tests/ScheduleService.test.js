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
});