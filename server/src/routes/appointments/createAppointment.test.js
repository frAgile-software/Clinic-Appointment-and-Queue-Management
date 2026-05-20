jest.mock('../../database/dbConnect', () => jest.fn(() => Promise.resolve()));

jest.mock('../../middleware/auth', () => ({
    requireAuth: (req, res, next) => next()
}));

jest.mock('../../database/models/User', () => ({
    findOne: jest.fn(),
    findById: jest.fn(),
}));

jest.mock('../../database/models/Clinic', () => ({
    findById: jest.fn(),
}));

jest.mock('../../database/models/Speciality', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../database/models/Appointment', () => {
    const mockSave = jest.fn();
    const mockConstructor = jest.fn().mockImplementation((data) => ({
        ...data,
        _id: 'appt-001',
        save: mockSave,
    }));
    mockConstructor.findOne = jest.fn();
    mockConstructor.mockSave = mockSave; // expose for assertions
    mockConstructor.findById = jest.fn();
    return mockConstructor;
});

const request     = require('supertest');
const app         = require('../../index');
const User        = require('../../database/models/User');
const Clinic      = require('../../database/models/Clinic');
const Speciality  = require('../../database/models/Speciality');
const Appointment = require('../../database/models/Appointment');

/* ─── Shared test data ───────────────────────────────────── */
const validBody = {
    Clinic:          'clinic123',
    Staff:           '69efb380a80012230d32b7a1',
    patientAuth0Id:  'auth0-test123',
    BookingDateTime: '2026-05-20T10:00:00Z',
    description:     'Checkup',
    Speciality:      'General Practice'
};

const mockPatient = { _id: 'patient123', auth0Id: 'auth0-test123' };
const mockStaff   = { _id: 'staff123', name: 'Dr. Test' };
const mockClinic  = { _id: 'clinic123', name: 'Test Clinic' };

describe('POST /api/appointments', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /* ── 404 entity not found tests ── */
    test('returns 404 if patient not found', async () => {
        User.findOne.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(404);
        expect(res.body.message).toBe('Patient not found.');
    });

    test('returns 404 if staff not found', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(404);
        expect(res.body.message).toBe('Staff member not found.');
    });

    test('returns 404 if clinic not found', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(404);
        expect(res.body.message).toBe('Clinic not found.');
    });

    /* ── 409 conflict test ── */
    test('returns 409 if appointment slot is already booked', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce({ _id: 'existing-appt' });

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(409);
        expect(res.body.message).toBe('This slot is already booked.');
    });

    /* ── 201 success test ── */
    test('creates a valid appointment successfully', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce(null);
        Appointment.mockSave.mockResolvedValueOnce();

        await request(app).post('/api/appointments').send(validBody);

        expect(Appointment.findOne).toHaveBeenCalledWith({
            Staff:           validBody.Staff,
            BookingDateTime: new Date(validBody.BookingDateTime),
            Status:          { $ne: "Cancelled" }
        });
    });

    /* ── 500 server error ── */
    test('returns 500 when User.findOne throws', async () => {
        User.findOne.mockRejectedValueOnce(new Error('DB connection lost'));

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(500);
        expect(res.body.message).toBe('Server error.');
    });

    test('returns 500 when Appointment.save throws', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce(null);
        Appointment.mockSave.mockRejectedValueOnce(new Error('Save failed'));

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(500);
        expect(res.body.message).toBe('Server error.');
    });
});