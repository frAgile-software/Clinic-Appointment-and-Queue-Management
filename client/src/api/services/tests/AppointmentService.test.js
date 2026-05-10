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
        it('shoudl call DELETE on the corretc path', async () => {
            const apptId = 'app1';
            service.cancel(apptId);
            expect(mockPrivateClient.delete).toHaveBeenCalledWith(
                `/appointments/${apptId}`,
                null,
                null
            );
        });
    });

    decribe('create', () => {
        const payload = {
            clinicId: 'cln1',
            staffUserId: 'staff1',
            patientAuth0Id: 'auth0|123',
            bookingdateTime: '2026-05-10T10:00:00Z',
            description: "Elbow :(",
            specialityName: "General Checkup",
        };

        it('should call POST on the correct path', async () => {
            service.crear(payload);
            expect(mockPrivateClient.post).toHaveBeenCalledWith(
                '/appointments/',
                {
                    Clinic: payload.clinicId,
                    Staff: payload.staffUserId,
                    patientAuth0Id: payload.patientAuth0Id,
                    BookingdateTime: payload.bookingdateTime,
                    description: payload.description,
                    Speciality: payload.specialityName,
                },
                null
            )
        });

        it('should return the result of the POST', async () => {
            const mockResponse = { id: 'new-appt' };
            mockPrivateClient.post.mockResolvedValue(mockResponse);
            expect(service.create(payload)).resolves.toBe(mockResponse);
        });
    });

    describe('getForAuth0Id', () => {
        it('should call GET on the correct path', () => {
            const auth0Id = 'auth0|user-123';
            service.getForAuth0Id(auth0Id);
            expect(mockPrivateClient.get).toHaveBeenCalledWith(
                `/appointments/${auth0Id}`,
                null
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
        };

        it('should call PUT on the correct path', () => {
            service.update(appointmentId, payload);
            expect(mockPrivateClient.put).toHaveBeenCalledWith(
                `/appointments/${appointmentId}`,
                {
                    Patient: payload.patientUID,
                    Staff: payload.staffUID,
                    Clinic: payload.clinicId,
                    BookingDateTime: payload.bookingDateTime,
                    Speciality: payload.specialityId,
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