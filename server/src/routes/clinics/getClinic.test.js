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

jest.mock('../../database/models/Clinic', () => ({
    findById: jest.fn()
}));

const request = require('supertest');
const app = require('../../index');
const Clinic = require('../../database/models/Clinic');

const VALID_CLINIC = {
    _id: '69420',
    province: 'Poong Province',
    physicalTown: 'Poong Town',
    physicalAddress: '123 Poong Rd',
    practiceName: 'Reliable Clinic Name',
    practiceType: '42',
    practiceTypeDescription: 'Clinic',
    practiceNumber: '42069',
    contactNumber: '0123456789',
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /api/clinics/:id', () => {

    test('Returns 200 clinic when found', async () => {
        Clinic.findById.mockResolvedValueOnce(VALID_CLINIC);

        const res = await request(app).get('/api/clinics/69420');

        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject(VALID_CLINIC);
    });

    test('Returns 404 if not found', async () => {
        Clinic.findById.mockResolvedValueOnce(null);

        const res = await request(app).get('/api/clinics/69420');

        expect(res.status).toEqual(404);
    });

    test('Returns 500 for server error', async () => {
        Clinic.findById.mockRejectedValueOnce(new Error('Server error'));

        const res = await request(app).get('/api/clinics/69420');

        expect(res.status).toEqual(500);
    });

});

describe('GET /clinics/:id', () => {

    test('Returns 200 clinic when found', async () => {
        Clinic.findById.mockResolvedValueOnce(VALID_CLINIC);

        const res = await request(app).get('/api/clinics/69420');

        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject(VALID_CLINIC);
    });

    test('Returns 404 if not found', async () => {
        Clinic.findById.mockResolvedValueOnce(null);

        const res = await request(app).get('/api/clinics/69420');

        expect(res.status).toEqual(404);
    });

    test('Returns 500 for server error', async () => {
        Clinic.findById.mockRejectedValueOnce(new Error('Server error'));

        const res = await request(app).get('/api/clinics/69420');

        expect(res.status).toEqual(500);
    });

});