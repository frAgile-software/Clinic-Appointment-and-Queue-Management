import { SpecialityService } from "../SpecialityService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(SpecialityService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('SpecialityService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};

        service = new SpecialityService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.cleanAllMocks());
});