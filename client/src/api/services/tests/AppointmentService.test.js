import { AppointmentService } from "../AppointmentService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(AppointmentService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('AppointmentService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};

        service = new AppointmentService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.cleanAllMocks());
});