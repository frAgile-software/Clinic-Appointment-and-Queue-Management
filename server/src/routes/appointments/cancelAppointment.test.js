jest.mock('../../middleware/auth', () => ({
    requireAuth: (req, res, next) => next() // just skip auth
}));


jest.mock('../../database/dbConnect', () => jest.fn(() => Promise.resolve()));

jest.mock('../../middleware/auth', () => ({
    requireAuth: (req, res, next) => next() // just skip auth
}));

jest.mock('../../database/models/Appointment', () => ({
    findById: jest.fn(),
    deleteOne: jest.fn()
}));

jest.mock('../../database/models/PatientLog', () => {
    return jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
    }));
});

const request = require('supertest');
const app = require('../../index');
const Appointment = require('../../database/models/Appointment');
const PatientLog = require('../../database/models/PatientLog');

describe('DELETE /api/appointments/:appointmentId', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 404 if appointment not found', async () => {
        Appointment.findById.mockResolvedValueOnce(null);

        const res = await request(app).delete('/api/appointments/mockId123');

        expect(res.status).toEqual(404);
    });

    test('returns 200, logs to PatientLog, and delete appointment on success', async () => {
        const mockAppointment = {
            _id: "appointment123",
            Speciality: "General Practice",
            Patient: "patient123",
            Staff: "staff456",
            BookingDateTime: new Date("2026-04-23T10:00:00Z"),
            createdAt: new Date("2026-04-01T08:00:00Z"),
            deleteOne: jest.fn().mockResolvedValue(true),
        };

        const mockPatientLog = {
            _id: "log001",
            Status: "Cancelled",
            save: jest.fn().mockResolvedValue(true),
        };

        Appointment.findById.mockResolvedValueOnce(mockAppointment);
        PatientLog.mockImplementation(() => mockPatientLog);

        const res = await request(app).delete('/api/appointments/appointment123');

        expect(Appointment.findById).toHaveBeenCalledWith("appointment123");

        expect(PatientLog).toHaveBeenCalledWith(
            expect.objectContaining({
                Speciality: "General Practice",
                Patient: "patient123",
                Staff: "staff456",
                VisitType: "Appointment",
                TimeIn: mockAppointment.BookingDateTime,
                TimeQStart: mockAppointment.createdAt,
                Status: "Cancelled",
            })
        );
        expect(mockPatientLog.save).toHaveBeenCalled();
        expect(mockAppointment.deleteOne).toHaveBeenCalled();

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            message: "Appointment cancelled",
            patientLog: expect.objectContaining({
                _id: "log001",
                Status: "Cancelled",
            }),
        });
    });

    test('returns 500 on server error', async () => {
        Appointment.findById.mockRejectedValueOnce(new Error('Server error.'));

        const res = await request(app).delete('/api/appointments/appointment123');

        expect(res.statusCode).toEqual(500);
    });
});