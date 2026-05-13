import { PatientLogService } from "../PatientLogService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(PatientLogService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('PatientLogService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() };
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() };

        service = new PatientLogService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.clearAllMocks());

    describe('constructor', () => {
        it('should set basePath to /patientLogs', async () => {
            expect(service.basePath).toBe('/patientLogs');
        });

        it('should assign public and private clients', async () => {
            expect(service.pub).toBe(mockPublicClient);
            expect(service.priv).toBe(mockPrivateClient);
        });
    });

    describe('getForAuth0Id', () => {
        it('should call GET on the correct path with a URL-encoded auth0Id', () => {
            const auth0Id = 'auth0|user-123';
            service.getForAuth0Id(auth0Id);
            
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                `/patientLogs/auth0%7Cuser-123`
            );
        });

        it('should return the result of the GET call', () => {
            const mockResponse = [{ _id: 'log1', Status: 'Completed' }];
            mockPrivateClient.get.mockResolvedValue(mockResponse);
            
            expect(service.getForAuth0Id('auth0|123')).resolves.toBe(mockResponse);
        });
    });
});