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
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};

        service = new ScheduleService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.cleanAllMocks());
});