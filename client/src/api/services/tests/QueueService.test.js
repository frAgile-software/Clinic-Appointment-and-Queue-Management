import { QueueService } from "../QueueService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(QueueService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('QueueService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};

        service = new QueueService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.cleanAllMocks());
});