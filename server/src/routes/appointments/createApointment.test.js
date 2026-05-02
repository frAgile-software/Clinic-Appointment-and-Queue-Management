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
    BookingDateTime: '2025-05-06T09:00:00.000Z',
    description:     'Chest pain follow-up',
};

const mockPatient = { _id: 'patient001', auth0Id: 'auth0-test123', role: 'Patient' };
const mockStaff   = { _id: '69efb380a80012230d32b7a1', role: 'Staff' };
const mockClinic  = { _id: 'clinic123', practiceName: 'City Clinic' };

describe('POST /api/appointments', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Suppress console output to prevent CI pipeline failures on expected errors
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    /* ── Happy path ── */
    test('returns 201 and success message when appointment created', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Speciality.findOne.mockResolvedValueOnce({ _id: 'spec123' });
        Appointment.findOne.mockResolvedValueOnce(null); // slot free
        Appointment.mockSave.mockResolvedValueOnce();

        const res = await request(app)
            .post('/api/appointments')
            .send({ ...validBody, Speciality: 'Cardiology' });

        expect(res.status).toEqual(201);
        expect(res.body.message).toBe('Appointment created successfully.');
        expect(res.body.appointment).toBeDefined();
        expect(Speciality.findOne).toHaveBeenCalledWith({ SpecialityName: 'Cardiology' });
    });

    test('calls User.findOne with patientAuth0Id', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce(null);
        Appointment.mockSave.mockResolvedValueOnce();

        await request(app).post('/api/appointments').send(validBody);

        expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0-test123' });
    });

    test('calls User.findById with Staff id', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce(null);
        Appointment.mockSave.mockResolvedValueOnce();

        await request(app).post('/api/appointments').send(validBody);

        expect(User.findById).toHaveBeenCalledWith(validBody.Staff);
    });

    test('calls Clinic.findById with Clinic id', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce(null);
        Appointment.mockSave.mockResolvedValueOnce();

        await request(app).post('/api/appointments').send(validBody);

        expect(Clinic.findById).toHaveBeenCalledWith(validBody.Clinic);
    });

    test('uses empty string for ReasonDetails when description omitted', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce(null);
        Appointment.mockSave.mockResolvedValueOnce();

        const bodyNoDesc = { ...validBody };
        delete bodyNoDesc.description;

        const res = await request(app).post('/api/appointments').send(bodyNoDesc);

        expect(res.status).toEqual(201);
        // Appointment constructor should have been called with ReasonDetails: ''
        expect(Appointment).toHaveBeenCalledWith(
            expect.objectContaining({ ReasonDetails: '' })
        );
    });

    /* ── 404 cases ── */
    test('returns 404 when patient not found', async () => {
        User.findOne.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(404);
        expect(res.body.message).toBe('Patient not found.');
    });

    test('returns 404 when staff member not found', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(404);
        expect(res.body.message).toBe('Staff member not found.');
    });

    test('returns 404 when clinic not found', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(404);
        expect(res.body.message).toBe('Clinic not found.');
    });

    /* ── 409 conflict ── */
    test('returns 409 when slot is already booked', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce({ _id: 'existing-appt' }); // slot taken

        const res = await request(app)
            .post('/api/appointments')
            .send(validBody);

        expect(res.status).toEqual(409);
        expect(res.body.message).toBe('This slot is already booked.');
    });

    test('checks correct Staff and BookingDateTime for conflict', async () => {
        User.findOne.mockResolvedValueOnce(mockPatient);
        User.findById.mockResolvedValueOnce(mockStaff);
        Clinic.findById.mockResolvedValueOnce(mockClinic);
        Appointment.findOne.mockResolvedValueOnce(null);
        Appointment.mockSave.mockResolvedValueOnce();

        await request(app).post('/api/appointments').send(validBody);

        expect(Appointment.findOne).toHaveBeenCalledWith({
            Staff:           validBody.Staff,
            BookingDateTime: new Date(validBody.BookingDateTime),
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