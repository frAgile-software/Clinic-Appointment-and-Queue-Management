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
                `/queues/patient/${patientAuth0Id}`,
                null
            );
        });
    });

    describe('addPatient', () => {
        const clinicId = 'clinic-1';
        const specialityName = 'General Practice';

        it('should call POST with auth0Id when patientId is not provided', () => {
            const auth0Id = 'auth0|123';
            service.addPatient(clinicId, { auth0Id }, specialityName);
            expect(mockPublicClient.post).toHaveBeenCalledWith(
                '/queues/',
                {
                    clinicId,
                    specialityName,
                    auth0Id
                }
            );
        });

        it('should call POST with patientId when provided', () => {
            const patientId = 'p-999';
            service.addPatient(clinicId, { patientId }, specialityName);
            expect(mockPublicClient.post).toHaveBeenCalledWith(
                '/queues/',
                {
                    clinicId,
                    specialityName,
                    patientId
                }
            );
        });
    });

    describe('remove', () => {
        it('should call DELETE on the correct path', () => {
            const queueId = 'q-123';
            service.remove(queueId);
            expect(mockPrivateClient.delete).toHaveBeenCalledWith(
                `/queues/${queueId}`,
                null,
                null
            );
        });
    });

    describe('update', () => {
        it('should call PUT with correctly mapped database fields', () => {
            const queueId = 'q-456';
            const updateData = {
                clinicId: 'c-1',
                specialityId: 's-1',
                patientId: 'p-1',
                status: 'Waiting',
                remarks: 'Urgent',
                timeSeen: '2026-05-14T10:00:00Z'
            };

            service.update(queueId, updateData);

            expect(mockPrivateClient.put).toHaveBeenCalledWith(
                `/queues/${queueId}`,
                {
                    Clinic: updateData.clinicId,
                    Speciality: updateData.specialityId,
                    Patient: updateData.patientId,
                    Status: updateData.status,
                    Remarks: updateData.remarks,
                    TimeSeen: updateData.timeSeen
                },
                null
            );
        });
    });

    describe('get', () => {
        const clinicId = 'clinic-123';
        const baseParams = { auth0Id: 'a1', userId: 'u1' };

        it('should join specialityIDs array into a comma-separated string', () => {
            service.get(clinicId, { ...baseParams, specialityIDs: ['spec-1', 'spec-2'] });
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                `/queues/${clinicId}`,
                expect.objectContaining({
                    specialityIDs: 'spec-1,spec-2'
                })
            );
        });

        it('should join statuses array into a comma-separated string', () => {
            service.get(clinicId, { ...baseParams, statuses: ['Waiting', 'Completed'] });
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                `/queues/${clinicId}`,
                expect.objectContaining({
                    statuses: 'Waiting,Completed'
                })
            );
        });
    });
});