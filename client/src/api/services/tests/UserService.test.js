import { UserService } from "../UserService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(UserService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('UserService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};

        service = new UserService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.cleanAllMocks());
});