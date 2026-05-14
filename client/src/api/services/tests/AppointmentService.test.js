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
        mockPrivateClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};
        mockPublicClient = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn()};

        service = new AppointmentService(mockPublicClient, mockPrivateClient);
    });

    afterEach(() => jest.clearAllMocks());

    describe('constructor', () => {
        it('should set basePath to /appointments', async () => {
            expect(service.basePath).toBe('/appointments');
        });

        it('should assign public and private clients', async () => {
            expect(service.pub).toBe(mockPublicClient);
            expect(service.priv).toBe(mockPrivateClient);
        });
    });

    describe('cancel', () => {
        it('should call PATCH on the correct path', async () => {
            const apptId = 'app1';
            service.cancel(apptId);
            expect(mockPrivateClient.patch).toHaveBeenCalledWith(
                `/appointments/${apptId}`,
                null,
                null
            );
        });
    });

    describe('create', () => {
        it('should call POST with correctly mapped fields', async () => {
            const payload = {
                clinicId: 'c1',
                staffUserId: 's1',
                patientAuth0Id: 'p1',
                bookingDateTime: '2026-05-14T10:00:00Z',
                description: 'Checkup',
                specialityName: 'GP',
                rescheduleAppointmentId: 'old-appt'
            };

            await service.create(payload);

            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/appointments/',
                {
                    Clinic: payload.clinicId,
                    Staff: payload.staffUserId,
                    patientAuth0Id: payload.patientAuth0Id,
                    BookingDateTime: payload.bookingDateTime,
                    description: payload.description,
                    Speciality: payload.specialityName,
                    rescheduleAppointmentId: payload.rescheduleAppointmentId
                },
                null
            );
        });
    });

    describe('getForAuth0Id', () => {
        it('should call GET on the correct path with statuses', () => {
            const auth0Id = 'auth0|user-123';
            service.getForAuth0Id(auth0Id, { statuses: ['Confirmed', 'Cancelled'] });
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                `/appointments/${auth0Id}`,
                { statuses: 'Confirmed,Cancelled' }
            );
        });
    });

    describe('update', () => {
        const appointmentId = 'appt-456';
        const payload = {
            patientUID: 'patient-uid-1',
            staffUID: 'staff-uid-1',
            clinicId: 'clinic-2',
            bookingDateTime: '2026-05-10T14:00:00Z',
            specialityId: 'spec-1',
            status: 'Confirmed',
            remarks: 'Arriving early'
        };

        it('should call PUT on the correct path with full payload', () => {
            service.update(appointmentId, payload);
            expect(mockPrivateClient.put).toHaveBeenCalledWith(
                `/appointments/${appointmentId}`,
                {
                    Patient: payload.patientUID,
                    Staff: payload.staffUID,
                    Clinic: payload.clinicId,
                    BookingDateTime: payload.bookingDateTime,
                    Speciality: payload.specialityId,
                    Status: payload.status,
                    Remarks: payload.remarks
                },
                null
            );
        });

        it('should return the result of the PUT call', () => {
            const mockResponse = { updated: true };
            mockPrivateClient.put.mockResolvedValue(mockResponse);
            expect(service.update(appointmentId, payload)).resolves.toBe(mockResponse);
        });
    });
});