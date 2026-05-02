jest.mock('../../database/dbConnect', () => jest.fn(() => Promise.resolve()));

jest.mock('express-oauth2-jwt-bearer', () => ({
    auth: jest.fn(() => (req, res, next) => {
        req.auth = {
            payload: {
                sub: 'auth0|mockUserId123',
                aud: process.env.SERVER_URL,
                iss: 'https://clinicsandqs-users.eu.auth0.com/',
                scope: 'openid profile email',
            }
        };
        next();
    })
}));

jest.mock('../../database/models/User', () => ({
    findById: jest.fn()
}));

jest.mock('../../database/models/Speciality', () => ({
    find: jest.fn()
}));

jest.mock('../../database/models/StaffSpeciality', () => ({
    find: jest.fn().mockReturnValue({
        populate: jest.fn()
    })
}));

const request = require('supertest');
const app = require('../../index');
const User = require('../../database/models/User');
const StaffSpeciality = require('../../database/models/StaffSpeciality');
const Speciality = require('../../database/models/Speciality');

const VALID_USER = {
    _id: '1234',
    role: 'Staff',
}

const MOCK_SPECIALITIES = [
    {Speciality: { _id: 'sp1', SpecialityName: 'Cardiology' }},
    {Speciality: { _id: 'sp2', SpecialityName: 'Neurology' }},
];

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /clinics/:staffID/specialities', () => {

    test('Returns 200 specialities when found', async () => {
        User.findById.mockResolvedValueOnce(VALID_USER);
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockResolvedValueOnce(MOCK_SPECIALITIES)
        });

        const res = await request(app).get('/clinics/1234/specialities');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            UserId: '1234',
            Specialities: ['Cardiology', 'Neurology']
        });
    });

    test('Returns 200 with empty Specialities when none found', async () => {
        User.findById.mockResolvedValueOnce(VALID_USER);
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockResolvedValueOnce([])
        });

        const res = await request(app).get('/clinics/1234/specialities');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            UserId: '1234',
            Specialities: []
        });
    });

    test('Returns 403 when user is not a staff member', async () => {
        User.findById.mockResolvedValueOnce({
            _id: '1234',
            role: 'Patient',
        });

        const res = await request(app).get('/clinics/1234/specialities');

        expect(res.statusCode).toEqual(403);
    });

    test('Returns 404 when staff not found', async () => {
        User.findById.mockResolvedValueOnce(null);

        const res = await request(app).get('/clinics/1234/specialities');

        expect(res.statusCode).toEqual(404);
    });

    test('Returns 500 on server error', async () => {
        User.findById.mockRejectedValueOnce(new Error("Server error."));

        const res = await request(app).get('/clinics/1234/specialities');

        expect(res.statusCode).toEqual(500);
    });
});

describe('GET /api/clinics/:staffID/specialities', () => {

    test('Returns 200 specialities when found', async () => {
        User.findById.mockResolvedValueOnce(VALID_USER);
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockResolvedValueOnce(MOCK_SPECIALITIES)
        });

        const res = await request(app).get('/api/clinics/1234/specialities');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            UserId: '1234',
            Specialities: ['Cardiology', 'Neurology']
        });
    });

    test('Returns 200 with empty Specialities when none found', async () => {
        User.findById.mockResolvedValueOnce(VALID_USER);
        StaffSpeciality.find.mockReturnValueOnce({
            populate: jest.fn().mockResolvedValueOnce([])
        });

        const res = await request(app).get('/api/clinics/1234/specialities');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            UserId: '1234',
            Specialities: []
        });
    });

    test('Returns 403 when user is not a staff member', async () => {
        User.findById.mockResolvedValueOnce({
            _id: '1234',
            role: 'Patient',
        });

        const res = await request(app).get('/api/clinics/1234/specialities');

        expect(res.statusCode).toEqual(403);
    });

    test('Returns 404 when staff not found', async () => {
        User.findById.mockResolvedValueOnce(null);

        const res = await request(app).get('/api/clinics/1234/specialities');

        expect(res.statusCode).toEqual(404);
    });

    test('Returns 500 on server error', async () => {
        User.findById.mockRejectedValueOnce(new Error("Server error."));

        const res = await request(app).get('/api/clinics/1234/specialities');

        expect(res.statusCode).toEqual(500);
    });
});