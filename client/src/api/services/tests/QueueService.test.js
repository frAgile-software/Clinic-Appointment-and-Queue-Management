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
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};

        service = new QueueService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.clearAllMocks());

    describe('constructor', () => {

        it('should set basePath to /queues', async () => {
            expect(service.basePath).toBe('/queues');
        });

        it('should assign public and private clients', async () => {
            expect(service.pub).toBe(mockPublicClient);
            expect(service.priv).toBe(mockPrivateClient);
        });
    });

    describe('getForPatient', () => {
        it('should call GET on the correct path', () => {
            const patientAuth0Id = 'auth0|patient-123';
            service.getForPatient(patientAuth0Id);
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                '/queues/patient/auth0|patient-123',
                null
            );
        });
    });

    describe('addPatient', () => {
        it('should call POST with patientId when patientId is provided', () => {
            service.addPatient('clinic-123', { patientId: 'patient-456' }, 'Cardiology');
            expect(mockPublicClient.post).toHaveBeenCalledWith(
                '/queues/',
                { clinicID: 'clinic-123', specialityName: 'Cardiology', patientId: 'patient-456' }
            );
        });

        it('should call POST with auth0Id when auth0Id is provided', () => {
            service.addPatient('clinic-123', { auth0Id: 'auth0|patient-456' }, 'Cardiology');
            expect(mockPublicClient.post).toHaveBeenCalledWith(
                '/queues/',
                { clinicID: 'clinic-123', specialityName: 'Cardiology', auth0Id: 'auth0|patient-456' }
            );
        });

        it('should not include both patientId and auth0Id in the body', () => {
            service.addPatient('clinic-123', { patientId: 'patient-456' }, 'Cardiology');
            const body = mockPublicClient.post.mock.calls[0][1];
            expect(body).toHaveProperty('patientId');
            expect(body).not.toHaveProperty('auth0Id');
        });

        it('should not throw when called without identifier object', () => {
            expect(() => service.addPatient('clinic-123', undefined, 'Cardiology')).not.toThrow();
        });
    });

    describe('remove', () => {
        it('should call DELETE on the correct path', () => {
            const queueId = 'queue-123';
            service.remove(queueId);
            expect(mockPrivateClient.delete).toHaveBeenCalledWith(
                '/queues/queue-123',
                null,
                null
            );
        });
    });

    describe('update', () => {
        const queueId = 'queue-123';
        const payload = { clinicId: 'clinic-1', specialityId: 'spec-1', patientId: 'patient-1' };

        it('should call PUT on the correct path with the correct body', () => {
            service.update(queueId, payload);
            expect(mockPrivateClient.put).toHaveBeenCalledWith(
                '/queues/queue-123',
                { Clinic: payload.clinicId, Speciality: payload.specialityId, Patient: payload.patientId },
                null
            );
        });

        it('should map params to correct key names in the request body', () => {
            service.update(queueId, payload);
            const body = mockPrivateClient.put.mock.calls[0][1];
            expect(body).toHaveProperty('Clinic');
            expect(body).toHaveProperty('Speciality');
            expect(body).toHaveProperty('Patient');
            expect(body).not.toHaveProperty('clinicId');
            expect(body).not.toHaveProperty('specialityId');
            expect(body).not.toHaveProperty('patientId');
        });
    });

    describe('get', () => {
        const clinicId = 'clinic-123';
        const baseParams = { auth0Id: 'auth0|user-1', userId: 'user-uid-1' };

        it('should call GET on the correct path with query params', () => {
            service.get(clinicId, { ...baseParams, specialityIDs: undefined, statuses: undefined });
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                '/queues/clinic-123',
                { auth0Id: baseParams.auth0Id, userId: baseParams.userId, specialityIDs: undefined, statuses: undefined }
            );
        });

        it('should join specialityIDs array into a comma-separated string', () => {
            service.get(clinicId, { ...baseParams, specialityIDs: ['spec-1', 'spec-2', 'spec-3'] });
            const params = mockPrivateClient.get.mock.calls[0][1];
            expect(params.specialityIDs).toBe('spec-1,spec-2,spec-3');
        });

        it('should pass specialityIDs through unchanged when already a string', () => {
            service.get(clinicId, { ...baseParams, specialityIDs: 'spec-1,spec-2' });
            const params = mockPrivateClient.get.mock.calls[0][1];
            expect(params.specialityIDs).toBe('spec-1,spec-2');
        });

        it('should pass specialityIDs through when given a single-element array', () => {
            service.get(clinicId, { ...baseParams, specialityIDs: ['spec-1'] });
            const params = mockPrivateClient.get.mock.calls[0][1];
            expect(params.specialityIDs).toBe('spec-1');
        });

        it('should join statuses array into a comma-separated string', () => {
            service.get(clinicId, { ...baseParams, statuses: ['Waiting', 'In Consult'] });
            const params = mockPrivateClient.get.mock.calls[0][1];
            expect(params.statuses).toBe('Waiting,In Consult');
        });

        it('should pass statuses through unchanged when already a string', () => {
            service.get(clinicId, { ...baseParams, statuses: 'Waiting' });
            const params = mockPrivateClient.get.mock.calls[0][1];
            expect(params.statuses).toBe('Waiting');
        });
    });
});