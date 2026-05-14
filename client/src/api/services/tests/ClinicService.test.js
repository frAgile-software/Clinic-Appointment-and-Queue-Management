import { ClinicService } from "../ClinicService";
import { ResourceService } from "../../ResourceService";

describe('Inheritance', () => {
    it('should extend ResourceService', async () => {
        expect(ClinicService.prototype).toBeInstanceOf(ResourceService);
    });
});

describe('ClinicService', () => {
    let service;
    let mockPrivateClient;
    let mockPublicClient;

    beforeEach(() => {
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};

        service = new ClinicService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.clearAllMocks());

    describe('constructor', () => {

        it('should set basePath to /clinics', async () => {
            expect(service.basePath).toBe('/clinics');
        });

        it('should assign public and private clients', async () => {
            expect(service.pub).toBe(mockPublicClient);
            expect(service.priv).toBe(mockPrivateClient);
        });
    });

    describe('getFilters', () => {
        it('should call GET on the correct path with queryParams', () => {
            const queryParams = { speciality: 'General Practice', province: 'Gauteng' };
            service.getFilters(queryParams);
            expect(mockPublicClient.get).toHaveBeenCalledWith('/clinics/filters/', queryParams);
        });
    });

    describe('filterAll', () => {
        it('should call GET on the correct path with queryParams', () => {
            const queryParams = { _page: 1, province: 'gauteng' };
            service.filterAll(queryParams);
            expect(mockPublicClient.get).toHaveBeenCalledWith('/clinics/', queryParams);
        });
    });

    describe('getById', () => {
        it('should call GET on the correct path', () => {
            const clinicId = 'clinic-123';
            service.getById(clinicId);
            expect(mockPublicClient.get).toHaveBeenCalledWith('/clinics/clinic-123', null);
        });
    });

    describe('getAssigned', () => {
        it('should call GET on the correct path with auth0Id as query param', () => {
            const auth0Id = 'auth0|user-123';
            service.getAssigned(auth0Id);
            expect(mockPrivateClient.get).toHaveBeenCalledWith('/clinics/assigned', { auth0Id });
        });
    });

    describe('linkAdmin', () => {
        it('should call POST on the correct path with the correct body', () => {
            const auth0Id = 'auth0|admin-1';
            const clinicId = 'clinic-456';
            const practiceNumber = 'PR-789';
            service.linkAdmin(auth0Id, clinicId, practiceNumber);
            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/clinics/',
                { auth0Id, clinicID: clinicId, practiceNumber },
                null
            );
        });

        it('should note clinicId is mapped to clinicID in the request body', () => {
            service.linkAdmin('auth0|x', 'clinic-1', 'PR-1');
            const body = mockPrivateClient.post.mock.calls[0][1];
            expect(body).toHaveProperty('clinicID');
            expect(body).not.toHaveProperty('clinicId');
        });
    });

    describe('updateClinic', () => {
        it('should call PUT on the correct path with updates', () => {
            const clinicId = 'clinic-123';
            const updates = { name: 'New Name', address: '123 Main St' };
            service.updateClinic(clinicId, updates);
            expect(mockPrivateClient.put).toHaveBeenCalledWith(
                '/clinics/clinic-123',
                updates,
                null
            );
        });
    });

    describe('removeStaff', () => {
        it('should call DELETE on the correct path', () => {
            const clinicId = 'clinic-123';
            const staffId = 'staff-456';
            service.removeStaff(clinicId, staffId);
            expect(mockPrivateClient.delete).toHaveBeenCalledWith(
                '/clinics/clinic-123/staff/staff-456',
                null,
                null
            );
        });
    });

    describe('listStaff', () => {
        it('should call GET on the correct path', () => {
            const clinicId = 'clinic-123';
            service.listStaff(clinicId);
            expect(mockPrivateClient.get).toHaveBeenCalledWith('/clinics/clinic-123/staff', null);
        });
    });

    describe('linkStaff', () => {
        const clinicId = 'clinic-123';
        const staffPayload = { auth0Id: 'auth0|staff-1', id: 'staff-uid-1', email: 'staff@example.com' };

        it('should call POST on the correct path with the correct body', () => {
            service.linkStaff(clinicId, staffPayload);
            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/clinics/clinic-123/staff',
                { id: staffPayload.id, email: staffPayload.email, auth0Id: staffPayload.auth0Id },
                null
            );
        });

        it('should work when email or id is omitted', () => {
            service.linkStaff(clinicId, { auth0Id: 'auth0|staff-1' });
            const body = mockPrivateClient.post.mock.calls[0][1];
            expect(body).toMatchObject({ auth0Id: 'auth0|staff-1' });
        });
    });

    describe('getAdmins', () => {
        it('should call GET on the correct path', () => {
            const clinicId = 'clinic-123';
            service.getAdmins(clinicId);
            expect(mockPrivateClient.get).toHaveBeenCalledWith('/clinics/clinic-123/admins', null);
        });
    });
});