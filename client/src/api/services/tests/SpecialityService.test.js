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

    afterEach(() => jest.clearAllMocks());

    describe('constructor', () => {

        it('should set basePath to /specialities', async () => {
            expect(service.basePath).toBe('/specialities');
        });

        it('should assign public and private clients', async () => {
            expect(service.pub).toBe(mockPublicClient);
            expect(service.priv).toBe(mockPrivateClient);
        });
    });

    describe('addToStaff', () => {
        const payload = { staffId: 'staff-123', specialityId: 'spec-456' };

        it('should call POST on the correct path', () => {
            service.addToStaff(payload);
            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/specialities/staff/staff-123/spec-456',
                null,
                null
            );
        });

        it('should encode both staffId and specialityId in the URL', () => {
            service.addToStaff(payload);
            const path = mockPrivateClient.post.mock.calls[0][0];
            expect(path).toContain(payload.staffId);
            expect(path).toContain(payload.specialityId);
        });
    });

    describe('removeFromStaff', () => {
        const payload = { staffId: 'staff-123', specialityId: 'spec-456' };

        it('should call DELETE on the correct path', () => {
            service.removeFromStaff(payload);
            expect(mockPrivateClient.delete).toHaveBeenCalledWith(
                '/specialities/staff/staff-123/spec-456',
                null,
                null
            );
        });

        it('should encode both staffId and specialityId in the URL', () => {
            service.removeFromStaff(payload);
            const path = mockPrivateClient.delete.mock.calls[0][0];
            expect(path).toContain(payload.staffId);
            expect(path).toContain(payload.specialityId);
        });
    });

    describe('getForStaff', () => {
        it('should call GET on the correct path', () => {
            const staffId = 'staff-123';
            service.getForStaff(staffId);
            expect(mockPublicClient.get).toHaveBeenCalledWith(
                '/specialities/staff/staff-123',
                null
            );
        });
    });
});